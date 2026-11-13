import { describe, it, expect, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { publishSealedCanonToFleet } from '../buz/fleetPublish.buzz.js'
import { MenuModel } from '../menu.model.js'
import { reducer } from '../menu.reduce.js'
import * as Act from '../menu.action.js'
import { PUBLISH_CANON_LABEL, updateMenu } from '../buz/00.menu.buzz.js'

vi.mock('../../00.lore.unit/buz/lore.buzz.js', () => ({
    resolveRepoRoot: () => (globalThis as any).__loreRoot,
}))

describe('299.lore - [Feature 1.1] Goblin Lore Fleet Publishing Menu Integration', () => {
    let tempFleetRoot: string

    afterEach(() => {
        vi.restoreAllMocks()
        if (tempFleetRoot && fs.existsSync(tempFleetRoot)) {
            fs.rmSync(tempFleetRoot, { recursive: true, force: true })
        }
    })

    it('automatically copies compiled bible-state.json into target engine and spatial sibling roots', async () => {
        tempFleetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-pub-'))
        const loreRoot = path.join(tempFleetRoot, '000.goblin-lore')
        const engineRoot = path.join(tempFleetRoot, '000.series-sower-engine')
        const spatialRoot = path.join(tempFleetRoot, '000.goblin-spatial')

        const seriesSlug = 'gotham-trinity-crisis'
        const compiledSource = path.join(
            loreRoot,
            'compiled',
            seriesSlug,
            'bible-state.json',
        )
        fs.mkdirSync(path.dirname(compiledSource), { recursive: true })
        fs.writeFileSync(
            compiledSource,
            JSON.stringify({
                series_slug: seriesSlug,
                _meta: { state_hash: 'abc123hash' },
            }),
            'utf-8',
        )

        fs.mkdirSync(engineRoot, { recursive: true })
        fs.mkdirSync(spatialRoot, { recursive: true })

        let resolved: any = null
        const bal: any = {
            idx: 'test-fleet-pub',
            src: seriesSlug,
            dat: {
                seriesSlug,
                targetEngineRoot: engineRoot,
                targetSpatialRoot: spatialRoot,
            },
            slv: (res: any) => {
                resolved = res
            },
        }

        ;(globalThis as any).__loreRoot = loreRoot

        await publishSealedCanonToFleet({}, bal, {
            hunt: async () => ({}),
        } as any)

        expect(resolved?.pubBit?.val).toBe(1)
        expect(resolved?.pubBit?.dat?.published).toBe(true)

        const targetEngineFile = path.join(
            engineRoot,
            'compiled',
            seriesSlug,
            'bible-state.json',
        )
        const targetSpatialFile = path.join(
            spatialRoot,
            'manifests',
            `${seriesSlug}-topology.json`,
        )

        expect(fs.existsSync(targetEngineFile)).toBe(true)
        expect(fs.existsSync(targetSpatialFile)).toBe(true)

        const engineContent = JSON.parse(
            fs.readFileSync(targetEngineFile, 'utf-8'),
        )
        expect(engineContent.series_slug).toBe(seriesSlug)

        const spatialContent = JSON.parse(
            fs.readFileSync(targetSpatialFile, 'utf-8'),
        )
        expect(spatialContent.series_slug).toBe(seriesSlug)
        expect(spatialContent.schema_version).toBe('1.0.0')
        expect(spatialContent.nodes).toBeDefined()
    })

    it('registers [P] PUBLISH SEALED CANON TO SIMULATION FLEET in updateMenu and routes PUBLISH_SEALED_CANON in reducer', async () => {
        const model = new MenuModel()
        let headlessReceipt: any = null
        await updateMenu(
            model,
            {
                idx: 'test-headless-list',
                slv: (res: any) => {
                    headlessReceipt = res
                },
            } as any,
            {} as any,
        )

        expect(headlessReceipt?.mnuBit?.lst).toContain(PUBLISH_CANON_LABEL)

        tempFleetRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-red-'))
        const loreRoot = path.join(tempFleetRoot, '000.goblin-lore')
        const engineRoot = path.join(tempFleetRoot, '000.series-sower-engine')
        const spatialRoot = path.join(tempFleetRoot, '000.goblin-spatial')
        fs.mkdirSync(engineRoot, { recursive: true })
        fs.mkdirSync(spatialRoot, { recursive: true })

        const seriesSlug = 'gotham-trinity-crisis'
        const compiledSource = path.join(
            loreRoot,
            'compiled',
            seriesSlug,
            'bible-state.json',
        )
        fs.mkdirSync(path.dirname(compiledSource), { recursive: true })
        fs.writeFileSync(
            compiledSource,
            JSON.stringify({
                series_slug: seriesSlug,
                _meta: { state_hash: 'abcd1234'.repeat(8) },
                entities: {
                    locations: {
                        loc_gotham_rooftop: {
                            title: 'Gotham Rooftop',
                            adjacent_locations: ['loc_wayne_tower'],
                            acoustic_damping_cdb: 1800,
                        },
                    },
                },
            }),
            'utf-8',
        )

        ;(globalThis as any).__loreRoot = loreRoot

        let pubResolved: any = null
        const action = new Act.PublishSealedCanon({
            idx: 'reducer-pub',
            src: seriesSlug,
            dat: {
                seriesSlug,
                targetEngineRoot: engineRoot,
                targetSpatialRoot: spatialRoot,
            },
            slv: (res: any) => {
                pubResolved = res
            },
        } as any)

        const nextModel = await reducer(model, action, {
            hunt: async () => ({}),
        } as any)

        expect(pubResolved?.pubBit?.val).toBe(1)
        expect(nextModel.statusMessage).toBe('FLEET_CANON_PUBLISHED')
    })
})
