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
})
