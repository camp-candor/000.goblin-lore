import { describe, it, expect, afterEach, vi } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { publishSealedCanonToFleet } from '../buz/fleetPublish.buzz.js'

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
    })
})
