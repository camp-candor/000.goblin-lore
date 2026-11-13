import { describe, it, expect, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { exportStaticTopologyManifest } from '../buz/topologyExport.buzz.js'

vi.mock('../../00.lore.unit/buz/lore.buzz.js', () => ({
    resolveRepoRoot: () => (globalThis as any).__loreRoot,
}))

describe('299.lore - [Task 1.1.3] Route Static Topology Export', () => {
    let tempFleetRoot: string

    afterEach(() => {
        vi.restoreAllMocks()
        if (tempFleetRoot && fs.existsSync(tempFleetRoot)) {
            fs.rmSync(tempFleetRoot, { recursive: true, force: true })
        }
    })

    it('extracts room geometry manifests and pushes TopologyManifest into 000.goblin-spatial', async () => {
        tempFleetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'topology-exp-'))
        const loreRoot = path.join(tempFleetRoot, '000.goblin-lore')
        const spatialRoot = path.join(tempFleetRoot, '000.goblin-spatial')

        const seriesSlug = 'gotham-trinity-crisis'
        const compiledBiblePath = path.join(
            loreRoot,
            'compiled',
            seriesSlug,
            'bible-state.json',
        )
        fs.mkdirSync(path.dirname(compiledBiblePath), { recursive: true })

        const mockBibleState = {
            _meta: { state_hash: 'aabbccdd11223344' },
            entities: {
                locations: {
                    loc_gotham_rooftop: {
                        title: 'Gotham Rooftop',
                        adjacent_locations: ['loc_gotham_chemical_plant'],
                        acoustic_damping_cdb: 2200,
                        lighting_level: 'INCANDESCENT',
                        max_adult_goblins: 4,
                        is_cramped: false,
                    },
                },
            },
        }
        fs.writeFileSync(
            compiledBiblePath,
            JSON.stringify(mockBibleState),
            'utf-8',
        )

        let resolved: any = null
        const bal: any = {
            idx: 'test-topology-export',
            src: seriesSlug,
            dat: {
                seriesSlug,
                targetSpatialRoot: spatialRoot,
            },
            slv: (res: any) => {
                resolved = res
            },
        }

        ;(globalThis as any).__loreRoot = loreRoot

        fs.mkdirSync(spatialRoot, { recursive: true })

        await exportStaticTopologyManifest({}, bal, {
            hunt: async () => ({}),
        } as any)

        expect(resolved?.topBit?.val).toBe(1)
        expect(resolved?.topBit?.dat?.exported).toBe(true)
        expect(resolved?.topBit?.dat?.nodeCount).toBe(1)

        const targetTopologyFile = path.join(
            spatialRoot,
            'manifests',
            `${seriesSlug}-topology.json`,
        )
        expect(fs.existsSync(targetTopologyFile)).toBe(true)

        const exportedManifest = JSON.parse(
            fs.readFileSync(targetTopologyFile, 'utf-8'),
        )
        expect(exportedManifest.series_slug).toBe(seriesSlug)
        expect(
            exportedManifest.nodes.loc_gotham_rooftop.acousticDampingFactor,
        ).toBe(2200)
    })

    it('fails closed with export-topology-fail (val: -1) and [TOPOLOGY_EXPORT_ERROR] when bible-state.json is missing', async () => {
        tempFleetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'topology-miss-'))
        const loreRoot = path.join(tempFleetRoot, '000.goblin-lore')
        const spatialRoot = path.join(tempFleetRoot, '000.goblin-spatial')
        fs.mkdirSync(loreRoot, { recursive: true })
        fs.mkdirSync(spatialRoot, { recursive: true })
        ;(globalThis as any).__loreRoot = loreRoot

        const logs: string[] = []
        let resolved: any = null
        await exportStaticTopologyManifest(
            {},
            {
                idx: 'trap-missing-bible',
                src: 'non-existent-series',
                dat: {
                    seriesSlug: 'non-existent-series',
                    targetSpatialRoot: spatialRoot,
                },
                slv: (res: any) => {
                    resolved = res
                },
            } as any,
            {
                hunt: async (_act: string, payload: any) => {
                    logs.push(payload?.src ?? '')
                    return {}
                },
            } as any,
        )

        expect(resolved?.topBit?.idx).toBe('export-topology-fail')
        expect(resolved?.topBit?.val).toBe(-1)
        expect(logs.some((l) => l.includes(':: [TOPOLOGY_EXPORT_ERROR]'))).toBe(
            true,
        )
        expect(fs.existsSync(path.join(spatialRoot, 'manifests'))).toBe(false)
    })

    it('degrades gracefully with export-topology-no-spatial (val: 0) when sibling spatial repo is absent', async () => {
        tempFleetRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'topology-nospatial-'),
        )
        const loreRoot = path.join(tempFleetRoot, '000.goblin-lore')
        const missingSpatial = path.join(tempFleetRoot, 'absent-spatial-repo')
        const seriesSlug = 'graceful-series'
        const compiledBiblePath = path.join(
            loreRoot,
            'compiled',
            seriesSlug,
            'bible-state.json',
        )
        fs.mkdirSync(path.dirname(compiledBiblePath), { recursive: true })
        fs.writeFileSync(
            compiledBiblePath,
            JSON.stringify({
                entities: {
                    locations: {
                        loc_room_a: { title: 'Room A' },
                        loc_room_b: { title: 'Room B' },
                    },
                },
            }),
            'utf-8',
        )
        ;(globalThis as any).__loreRoot = loreRoot

        const logs: string[] = []
        let resolved: any = null
        await exportStaticTopologyManifest(
            {},
            {
                idx: 'trap-no-spatial',
                src: seriesSlug,
                dat: {
                    seriesSlug,
                    targetSpatialRoot: missingSpatial,
                },
                slv: (res: any) => {
                    resolved = res
                },
            } as any,
            {
                hunt: async (_act: string, payload: any) => {
                    logs.push(payload?.src ?? '')
                    return {}
                },
            } as any,
        )

        expect(resolved?.topBit?.idx).toBe('export-topology-no-spatial')
        expect(resolved?.topBit?.val).toBe(0)
        expect(resolved?.topBit?.dat?.nodeCount).toBe(2)
        expect(logs.some((l) => l.includes('>> [TOPOLOGY:WARN]'))).toBe(true)
    })

    it('catches malformed JSON with export-topology-error (val: -1) and [TOPOLOGY_FAULT]', async () => {
        tempFleetRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'topology-badjson-'),
        )
        const loreRoot = path.join(tempFleetRoot, '000.goblin-lore')
        const spatialRoot = path.join(tempFleetRoot, '000.goblin-spatial')
        const seriesSlug = 'broken-json-series'
        const compiledBiblePath = path.join(
            loreRoot,
            'compiled',
            seriesSlug,
            'bible-state.json',
        )
        fs.mkdirSync(path.dirname(compiledBiblePath), { recursive: true })
        fs.writeFileSync(compiledBiblePath, '{ broken_topology_json', 'utf-8')
        fs.mkdirSync(spatialRoot, { recursive: true })
        ;(globalThis as any).__loreRoot = loreRoot

        const logs: string[] = []
        let resolved: any = null
        await exportStaticTopologyManifest(
            {},
            {
                idx: 'trap-bad-json',
                src: seriesSlug,
                dat: {
                    seriesSlug,
                    targetSpatialRoot: spatialRoot,
                },
                slv: (res: any) => {
                    resolved = res
                },
            } as any,
            {
                hunt: async (_act: string, payload: any) => {
                    logs.push(payload?.src ?? '')
                    return {}
                },
            } as any,
        )

        expect(resolved?.topBit?.idx).toBe('export-topology-error')
        expect(resolved?.topBit?.val).toBe(-1)
        expect(logs.some((l) => l.includes(':: [TOPOLOGY_FAULT]'))).toBe(true)
    })
})
