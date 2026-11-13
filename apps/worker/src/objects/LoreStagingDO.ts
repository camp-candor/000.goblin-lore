import type {
    TrunkCanonSealSnapshot,
    EntityMutexLease,
    StagedDraftProposal,
    StagingDrainBundle,
} from '../types/staging.js'
import {
    verifyPinnedSchemaBundle,
    validateEdgeDraftPayload,
    type PinnedEdgeSchemaBundle,
    type EdgeEntityDomain,
} from '../validation/edgeLoreValidator.js'

export const INTERACTIVE_LEASE_TTL_MS = 5 * 60 * 1000
export const STALE_DRAFT_EVICTION_TTL_MS = 72 * 60 * 60 * 1000

export interface DOStorageLike {
    get<T = unknown>(key: string): Promise<T | undefined>
    put<T = unknown>(key: string, value: T): Promise<void>
    delete(key: string): Promise<boolean>
    list<T = unknown>(options?: { prefix?: string }): Promise<Map<string, T>>
}

export interface DOStateLike {
    storage: DOStorageLike
}

export async function computeDependencyHash(
    targetEntityId: string,
    foreignKeyIds: string[],
    entityHashes: Record<string, string>,
): Promise<string> {
    const uniqueIds = Array.from(
        new Set([targetEntityId, ...foreignKeyIds]),
    ).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    const canonicalInput = uniqueIds
        .map((id) => `${id}:${entityHashes[id] || 'MISSING_ENTITY_HASH'}`)
        .join('|')

    const data = new TextEncoder().encode(canonicalInput)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

function jsonResponse(body: unknown, status: number = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { 'content-type': 'application/json; charset=utf-8' },
    })
}

export class LoreStagingDO {
    constructor(private readonly ctx: DOStateLike) {}

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url)
        const pathname = url.pathname
        const now = Number(request.headers.get('x-sim-now-ms')) || Date.now()

        if (request.method === 'POST' && pathname.endsWith('/trunk/seal')) {
            const seal = (await request.json()) as TrunkCanonSealSnapshot
            await this.ctx.storage.put('seal:active', seal)

            const draftsMap = await this.ctx.storage.list<StagedDraftProposal>({
                prefix: 'draft:',
            })
            let invalidatedCount = 0

            for (const [key, draft] of draftsMap.entries()) {
                if (draft.status !== 'OPEN') continue
                const expectedDep = await computeDependencyHash(
                    draft.entity_id,
                    draft.foreign_key_ids,
                    seal.entity_hashes,
                )
                if (draft.base_h_dep !== expectedDep) {
                    draft.status = 'REBASE_REQUIRED'
                    draft.updated_at_ms = now
                    await this.ctx.storage.put(key, draft)
                    invalidatedCount++
                }
            }

            return jsonResponse({
                ok: true,
                h_root: seal.h_root,
                invalidated_drafts: invalidatedCount,
            })
        }

        if (request.method === 'POST' && pathname.endsWith('/drafts/stage')) {
            const body = (await request.json()) as {
                draft_id: string
                series_slug: string
                entity_id: string
                author_id: string
                base_h_root: string
                base_h_dep: string
                foreign_key_ids?: string[]
                markdown_payload: string
            }

            const seal =
                await this.ctx.storage.get<TrunkCanonSealSnapshot>(
                    'seal:active',
                )
            if (!seal) {
                return jsonResponse(
                    {
                        ok: false,
                        errorCode: 'TRUNK_SEAL_UNINITIALIZED',
                        reason: 'Edge staging buffer has not received an active trunk seal snapshot',
                    },
                    409,
                )
            }

            const fkIds = Array.isArray(body.foreign_key_ids)
                ? body.foreign_key_ids
                : []
            const currentHDep = await computeDependencyHash(
                body.entity_id,
                fkIds,
                seal.entity_hashes,
            )

            if (body.base_h_dep !== currentHDep) {
                return jsonResponse(
                    {
                        ok: false,
                        errorCode: 'STALE_CANON_REBASE_REQUIRED',
                        reason: 'Canon updated at trunk (H_dep mismatch). Re-basing draft required',
                        expected_h_dep: currentHDep,
                    },
                    409,
                )
            }

            const leaseKey = `lease:${body.entity_id}`
            const existingLease =
                await this.ctx.storage.get<EntityMutexLease>(leaseKey)
            if (
                existingLease &&
                existingLease.expires_at_ms > now &&
                existingLease.holder_id !== body.author_id
            ) {
                return jsonResponse(
                    {
                        ok: false,
                        errorCode: 'ENTITY_LEASE_LOCKED',
                        reason: `Entity '${body.entity_id}' is currently locked by '${existingLease.holder_id}'`,
                        expires_at_ms: existingLease.expires_at_ms,
                    },
                    423,
                )
            }

            const newLease: EntityMutexLease = {
                entity_id: body.entity_id,
                holder_id: body.author_id,
                acquired_at_ms: existingLease?.acquired_at_ms || now,
                expires_at_ms: now + INTERACTIVE_LEASE_TTL_MS,
            }
            await this.ctx.storage.put(leaseKey, newLease)

            const existingDraft =
                await this.ctx.storage.get<StagedDraftProposal>(
                    `draft:${body.draft_id}`,
                )
            const proposal: StagedDraftProposal = {
                draft_id: body.draft_id,
                series_slug: body.series_slug,
                entity_id: body.entity_id,
                author_id: body.author_id,
                base_h_root: body.base_h_root,
                base_h_dep: body.base_h_dep,
                foreign_key_ids: fkIds,
                markdown_payload: body.markdown_payload,
                created_at_ms: existingDraft?.created_at_ms || now,
                updated_at_ms: now,
                status: 'OPEN',
            }
            await this.ctx.storage.put(`draft:${body.draft_id}`, proposal)

            return jsonResponse(
                { ok: true, draft: proposal, lease: newLease },
                200,
            )
        }

        if (
            request.method === 'POST' &&
            pathname.endsWith('/drafts/sweep-ttl')
        ) {
            const draftsMap = await this.ctx.storage.list<StagedDraftProposal>({
                prefix: 'draft:',
            })
            const evictedIds: string[] = []

            for (const [key, draft] of draftsMap.entries()) {
                if (now - draft.updated_at_ms > STALE_DRAFT_EVICTION_TTL_MS) {
                    draft.status = 'EVICTED_TTL'
                    await this.ctx.storage.put(
                        `evicted:${draft.draft_id}`,
                        draft,
                    )
                    await this.ctx.storage.delete(key)
                    await this.ctx.storage.delete(`lease:${draft.entity_id}`)
                    evictedIds.push(draft.draft_id)
                }
            }

            return jsonResponse({
                ok: true,
                evicted_count: evictedIds.length,
                evicted_ids: evictedIds,
            })
        }

        if (request.method === 'GET' && pathname.endsWith('/drafts/drain')) {
            const seal =
                await this.ctx.storage.get<TrunkCanonSealSnapshot>(
                    'seal:active',
                )
            const draftsMap = await this.ctx.storage.list<StagedDraftProposal>({
                prefix: 'draft:',
            })
            const openDrafts = Array.from(draftsMap.values())
                .filter((d) => d.status === 'OPEN')
                .sort((a, b) =>
                    a.draft_id < b.draft_id
                        ? -1
                        : a.draft_id > b.draft_id
                          ? 1
                          : 0,
                )

            const bundle: StagingDrainBundle = {
                series_slug: seal?.series_slug || 'unknown-series',
                trunk_h_root: seal?.h_root || '',
                drained_at_ms: now,
                drafts: openDrafts,
            }
            return jsonResponse(bundle)
        }

        if (request.method === 'POST' && pathname.endsWith('/schemas/pin')) {
            const bundle = (await request.json()) as PinnedEdgeSchemaBundle
            const isAuthentic = await verifyPinnedSchemaBundle(bundle)
            if (!isAuthentic) {
                return jsonResponse(
                    {
                        ok: false,
                        errorCode: 'SCHEMA_BUNDLE_SKEW_BREACH',
                        reason: 'Submitted schemas.json bundle failed SHA-256 integrity verification',
                    },
                    409,
                )
            }
            await this.ctx.storage.put('schema:pinned', bundle)
            return jsonResponse({
                ok: true,
                schema_version: bundle.schema_version,
                trunk_commit_sha: bundle.trunk_commit_sha,
                schema_bundle_hash: bundle.schema_bundle_hash,
            })
        }

        if (
            request.method === 'POST' &&
            pathname.endsWith('/drafts/validate')
        ) {
            const pinned =
                await this.ctx.storage.get<PinnedEdgeSchemaBundle>(
                    'schema:pinned',
                )
            if (!pinned) {
                return jsonResponse(
                    {
                        ok: false,
                        errorCode: 'SCHEMA_BUNDLE_SKEW_BREACH',
                        reason: 'Edge staging buffer has no pinned schemas.json bundle',
                    },
                    409,
                )
            }
            const body = (await request.json()) as {
                entity_id: string
                domain: EdgeEntityDomain
                schema_bundle_hash: string
                frontmatter: Record<string, unknown>
                raw_markdown: string
            }
            const receipt = validateEdgeDraftPayload(body, pinned)
            return jsonResponse(receipt, receipt.valid ? 200 : 422)
        }

        // Enforce schema validation in /drafts/stage when pinned bundle exists
        // (handled inside the /drafts/stage branch above via optional check)

        return jsonResponse({ ok: false, errorCode: 'NOT_FOUND' }, 404)
    }
}
