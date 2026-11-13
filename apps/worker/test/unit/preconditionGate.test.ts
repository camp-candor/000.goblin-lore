import { describe, it, expect } from 'vitest'
import { handleVerifyScenePrecondition } from '../../src/validation/preconditionGate.js'

describe('apps/worker :: HTTP 412 Dirty-Scene Precondition Gate', () => {
    const validHash = 'a'.repeat(64)

    it('admits fresh scene with HTTP 200 when Merkle hashes and pinned fact versions match', async () => {
        const req = new Request(
            'https://edge.local/api/lore/verify-scene-precondition',
            {
                method: 'POST',
                body: JSON.stringify({
                    scene_id: 'EP101_SC01',
                    series_slug: 'under-the-floorboards',
                    scene_bible_merkle_hash: validHash,
                    sealed_root_merkle_hash: validHash,
                    is_dirty: 0,
                    fact_dependencies: [
                        {
                            fact_id: 'fact_siphon_valve',
                            entity_id: 'loc_culvert_siphon',
                            pinned_version: 3,
                            current_version: 3,
                        },
                    ],
                    required_kinetic_verbs: ['INSPECT'],
                    banned_kinetic_verbs: ['BIMANUAL_LIFT'],
                }),
            },
        )

        const res = await handleVerifyScenePrecondition(req)
        expect(res.status).toBe(200)
        const body = (await res.json()) as any
        expect(body.admitted).toBe(true)
        expect(body.merkle_verified).toBe(true)
    })

    it('rejects scene with HTTP 412 DIRTY_SCENE_REJECTED when is_dirty === 1', async () => {
        const req = new Request(
            'https://edge.local/api/lore/verify-scene-precondition',
            {
                method: 'POST',
                body: JSON.stringify({
                    scene_id: 'EP101_SC02',
                    series_slug: 'under-the-floorboards',
                    scene_bible_merkle_hash: validHash,
                    sealed_root_merkle_hash: validHash,
                    is_dirty: 1,
                    fact_dependencies: [],
                }),
            },
        )

        const res = await handleVerifyScenePrecondition(req)
        expect(res.status).toBe(412)
        const body = (await res.json()) as any
        expect(body.error).toBe('DIRTY_SCENE_REJECTED')
        expect(body.collisions[0].reason_code).toBe('DIRTY_FLAG_ACTIVE')
    })

    it('rejects scene with HTTP 412 DIRTY_SCENE_REJECTED when pinned_version < current_version', async () => {
        const req = new Request(
            'https://edge.local/api/lore/verify-scene-precondition',
            {
                method: 'POST',
                body: JSON.stringify({
                    scene_id: 'EP101_SC03',
                    series_slug: 'under-the-floorboards',
                    scene_bible_merkle_hash: validHash,
                    sealed_root_merkle_hash: validHash,
                    is_dirty: 0,
                    fact_dependencies: [
                        {
                            fact_id: 'fact_wart_trauma',
                            entity_id: 'char_wart',
                            pinned_version: 1,
                            current_version: 2,
                        },
                    ],
                }),
            },
        )

        const res = await handleVerifyScenePrecondition(req)
        expect(res.status).toBe(412)
        const body = (await res.json()) as any
        expect(body.error).toBe('DIRTY_SCENE_REJECTED')
        expect(body.collisions[0].reason_code).toBe('PINNED_VERSION_STALE')
    })

    it('rejects scene with HTTP 412 DIRTY_SCENE_REJECTED when bible_merkle_hash diverges from root_merkle_hash', async () => {
        const req = new Request(
            'https://edge.local/api/lore/verify-scene-precondition',
            {
                method: 'POST',
                body: JSON.stringify({
                    scene_id: 'EP101_SC04',
                    series_slug: 'under-the-floorboards',
                    scene_bible_merkle_hash: '0'.repeat(64),
                    sealed_root_merkle_hash: validHash,
                    is_dirty: 0,
                    fact_dependencies: [],
                }),
            },
        )

        const res = await handleVerifyScenePrecondition(req)
        expect(res.status).toBe(412)
        const body = (await res.json()) as any
        expect(body.error).toBe('DIRTY_SCENE_REJECTED')
        expect(body.merkle_delta.matches).toBe(false)
    })

    it('rejects scene with HTTP 412 DIRTY_SCENE_REJECTED when required kinetic verb is banned', async () => {
        const req = new Request(
            'https://edge.local/api/lore/verify-scene-precondition',
            {
                method: 'POST',
                body: JSON.stringify({
                    scene_id: 'EP101_SC05',
                    series_slug: 'under-the-floorboards',
                    scene_bible_merkle_hash: validHash,
                    sealed_root_merkle_hash: validHash,
                    is_dirty: 0,
                    fact_dependencies: [],
                    required_kinetic_verbs: ['BIMANUAL_LIFT'],
                    banned_kinetic_verbs: ['BIMANUAL_LIFT'],
                }),
            },
        )

        const res = await handleVerifyScenePrecondition(req)
        expect(res.status).toBe(412)
        const body = (await res.json()) as any
        expect(body.error).toBe('DIRTY_SCENE_REJECTED')
        expect(body.collisions[0].reason_code).toBe('SOMATIC_VERB_REVOKED')
    })
})
