import { describe, it, expect, beforeEach } from 'vitest'
import {
    LoreStagingDO,
    computeDependencyHash,
    STALE_DRAFT_EVICTION_TTL_MS,
    type DOStorageLike,
} from '../../src/objects/LoreStagingDO.js'

class MemoryDOStorage implements DOStorageLike {
    private map = new Map<string, any>()

    async get<T = unknown>(key: string): Promise<T | undefined> {
        return this.map.get(key)
    }

    async put<T = unknown>(key: string, value: T): Promise<void> {
        this.map.set(key, structuredClone(value))
    }

    async delete(key: string): Promise<boolean> {
        return this.map.delete(key)
    }

    async list<T = unknown>(options?: {
        prefix?: string
    }): Promise<Map<string, T>> {
        const out = new Map<string, T>()
        for (const [k, v] of this.map.entries()) {
            if (!options?.prefix || k.startsWith(options.prefix)) {
                out.set(k, structuredClone(v))
            }
        }
        return out
    }
}

describe('apps/worker :: Edge LoreStagingDO Quarantine Buffer', () => {
    let stagingDO: LoreStagingDO
    const seriesSlug = 'under-the-floorboards'
    const baseHashes = {
        char_bog: '1'.repeat(64),
        loc_culvert_siphon: '2'.repeat(64),
    }

    beforeEach(async () => {
        stagingDO = new LoreStagingDO({ storage: new MemoryDOStorage() })
        await stagingDO.fetch(
            new Request('https://edge.local/trunk/seal', {
                method: 'POST',
                body: JSON.stringify({
                    series_slug: seriesSlug,
                    commit_sha: 'abc1234',
                    schema_version: '1.0.0',
                    h_root: '9'.repeat(64),
                    entity_hashes: baseHashes,
                    sealed_at_ms: 1000,
                }),
            }),
        )
    })

    it('stages valid H_dep-bound draft and blocks concurrent writer with 423 ENTITY_LEASE_LOCKED', async () => {
        const hDep = await computeDependencyHash(
            'char_bog',
            ['loc_culvert_siphon'],
            baseHashes,
        )

        const resA = await stagingDO.fetch(
            new Request('https://edge.local/drafts/stage', {
                method: 'POST',
                headers: { 'x-sim-now-ms': '2000' },
                body: JSON.stringify({
                    draft_id: 'draft_01',
                    series_slug: seriesSlug,
                    entity_id: 'char_bog',
                    author_id: 'writer_alice',
                    base_h_root: '9'.repeat(64),
                    base_h_dep: hDep,
                    foreign_key_ids: ['loc_culvert_siphon'],
                    markdown_payload: '---\nid: char_bog\n---\nDraft A\n',
                }),
            }),
        )
        expect(resA.status).toBe(200)

        const resB = await stagingDO.fetch(
            new Request('https://edge.local/drafts/stage', {
                method: 'POST',
                headers: { 'x-sim-now-ms': '2500' },
                body: JSON.stringify({
                    draft_id: 'draft_02',
                    series_slug: seriesSlug,
                    entity_id: 'char_bog',
                    author_id: 'writer_bob',
                    base_h_root: '9'.repeat(64),
                    base_h_dep: hDep,
                    foreign_key_ids: ['loc_culvert_siphon'],
                    markdown_payload: '---\nid: char_bog\n---\nDraft B\n',
                }),
            }),
        )
        expect(resB.status).toBe(423)
        const errBody = (await resB.json()) as any
        expect(errBody.errorCode).toBe('ENTITY_LEASE_LOCKED')
    })

    it('rejects stale H_dep drafts with 409 STALE_CANON_REBASE_REQUIRED when trunk mutates', async () => {
        const staleHDep = await computeDependencyHash(
            'char_bog',
            ['loc_culvert_siphon'],
            baseHashes,
        )

        await stagingDO.fetch(
            new Request('https://edge.local/trunk/seal', {
                method: 'POST',
                body: JSON.stringify({
                    series_slug: seriesSlug,
                    commit_sha: 'def5678',
                    schema_version: '1.0.0',
                    h_root: '8'.repeat(64),
                    entity_hashes: {
                        char_bog: '1'.repeat(64),
                        loc_culvert_siphon: 'f'.repeat(64),
                    },
                    sealed_at_ms: 3000,
                }),
            }),
        )

        const res = await stagingDO.fetch(
            new Request('https://edge.local/drafts/stage', {
                method: 'POST',
                headers: { 'x-sim-now-ms': '3100' },
                body: JSON.stringify({
                    draft_id: 'draft_stale',
                    series_slug: seriesSlug,
                    entity_id: 'char_bog',
                    author_id: 'writer_alice',
                    base_h_root: '9'.repeat(64),
                    base_h_dep: staleHDep,
                    foreign_key_ids: ['loc_culvert_siphon'],
                    markdown_payload: '---\nid: char_bog\n---\nStale\n',
                }),
            }),
        )
        expect(res.status).toBe(409)
        const body = (await res.json()) as any
        expect(body.errorCode).toBe('STALE_CANON_REBASE_REQUIRED')
    })

    it('sweeps drafts idle > 72 hours and releases entity mutex locks', async () => {
        const hDep = await computeDependencyHash(
            'char_bog',
            ['loc_culvert_siphon'],
            baseHashes,
        )

        await stagingDO.fetch(
            new Request('https://edge.local/drafts/stage', {
                method: 'POST',
                headers: { 'x-sim-now-ms': '5000' },
                body: JSON.stringify({
                    draft_id: 'draft_old',
                    series_slug: seriesSlug,
                    entity_id: 'char_bog',
                    author_id: 'writer_alice',
                    base_h_root: '9'.repeat(64),
                    base_h_dep: hDep,
                    foreign_key_ids: ['loc_culvert_siphon'],
                    markdown_payload: '---\nid: char_bog\n---\nOld\n',
                }),
            }),
        )

        const after73Hours = 5000 + STALE_DRAFT_EVICTION_TTL_MS + 3600_000
        const sweepRes = await stagingDO.fetch(
            new Request('https://edge.local/drafts/sweep-ttl', {
                method: 'POST',
                headers: { 'x-sim-now-ms': String(after73Hours) },
            }),
        )
        const sweepBody = (await sweepRes.json()) as any
        expect(sweepBody.evicted_ids).toEqual(['draft_old'])

        const resB = await stagingDO.fetch(
            new Request('https://edge.local/drafts/stage', {
                method: 'POST',
                headers: { 'x-sim-now-ms': String(after73Hours + 100) },
                body: JSON.stringify({
                    draft_id: 'draft_bob_new',
                    series_slug: seriesSlug,
                    entity_id: 'char_bog',
                    author_id: 'writer_bob',
                    base_h_root: '9'.repeat(64),
                    base_h_dep: hDep,
                    foreign_key_ids: ['loc_culvert_siphon'],
                    markdown_payload: '---\nid: char_bog\n---\nBob\n',
                }),
            }),
        )
        expect(resB.status).toBe(200)
    })
})
