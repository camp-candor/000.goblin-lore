import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
    jcsSerialize,
    computePreSealMerkleHash,
    loadBibleState,
    getStaticSpatialGraph,
} from '../buz/bibleClient.buzz.js'

describe('23.port.unit :: RFC 8785 Merkle Verification Port', () => {
    let tempRepoRoot: string
    const seriesSlug = 'wiregrass-basin'

    beforeEach(() => {
        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'goblin-bible-client-'),
        )
        const compiledDir = path.join(tempRepoRoot, 'compiled', seriesSlug)
        fs.mkdirSync(compiledDir, { recursive: true })

        const preSeal = {
            schema_version: '1.0.0',
            series_slug: seriesSlug,
            catalog_summary: { total_entities: 2 },
            entity_hashes: {
                char_bog: '1'.repeat(64),
                loc_culvert_siphon: '2'.repeat(64),
            },
            entities: {
                char_bog: { id: 'char_bog', name: 'Bog' },
                loc_culvert_siphon: {
                    id: 'loc_culvert_siphon',
                    title: 'Culvert Siphon',
                    portal_links: [
                        {
                            portal_slug: 'portal_siphon_to_flue',
                            target_location_id: 'loc_boiler_flue',
                            damping_cdb: 2000,
                            line_of_sight: false,
                        },
                    ],
                },
            },
        }

        const rootHash = computePreSealMerkleHash(preSeal)
        fs.writeFileSync(
            path.join(compiledDir, 'bible-state.json'),
            JSON.stringify({ ...preSeal, root_merkle_hash: rootHash }, null, 2),
            'utf8',
        )
    })

    afterEach(() => {
        if (fs.existsSync(tempRepoRoot)) {
            fs.rmSync(tempRepoRoot, { recursive: true, force: true })
        }
    })

    it('produces identical RFC 8785 JCS strings regardless of key insertion order', () => {
        const objA = { z: 1, a: { d: 'hello', b: [3, 2, 1] } }
        const objB = { a: { b: [3, 2, 1], d: 'hello' }, z: 1 }
        expect(jcsSerialize(objA)).toBe(jcsSerialize(objB))
        expect(jcsSerialize(objA)).toBe('{"a":{"b":[3,2,1],"d":"hello"},"z":1}')
    })

    it('verifies valid Merkle root and returns recursively deep-frozen BibleStateEnvelope', () => {
        const state = loadBibleState(seriesSlug, { repoRoot: tempRepoRoot })

        expect(state.series_slug).toBe(seriesSlug)
        expect(state.root_merkle_hash).toMatch(/^[0-9a-f]{64}$/)
        expect(Object.isFrozen(state)).toBe(true)
        expect(Object.isFrozen(state.entities)).toBe(true)
        expect(Object.isFrozen(state.entities.char_bog)).toBe(true)

        expect(() => {
            ;(state.entities.char_bog as any).name = 'Mutated'
        }).toThrow(TypeError)
    })

    it('immediately throws CANON_TAMPER_DETECTED when a single byte is altered on disk', () => {
        const biblePath = path.join(
            tempRepoRoot,
            'compiled',
            seriesSlug,
            'bible-state.json',
        )
        const raw = fs.readFileSync(biblePath, 'utf8')
        const tampered = raw.replace('"Bog"', '"B0g"')
        fs.writeFileSync(biblePath, tampered, 'utf8')

        expect(() =>
            loadBibleState(seriesSlug, { repoRoot: tempRepoRoot }),
        ).toThrow(/\[CANON_TAMPER_DETECTED\]/)
    })

    it('extracts a tamper-verified, deep-frozen StaticSpatialGraph', () => {
        const graph = getStaticSpatialGraph(seriesSlug, {
            repoRoot: tempRepoRoot,
        })

        expect(Object.isFrozen(graph)).toBe(true)
        expect(Object.isFrozen(graph.edges)).toBe(true)
        expect(graph.locations.loc_culvert_siphon).toBeDefined()
        expect(graph.edges).toHaveLength(1)
        expect(graph.edges[0].target_location_id).toBe('loc_boiler_flue')
        expect(graph.edges[0].damping_cdb).toBe(2000)
    })
})
