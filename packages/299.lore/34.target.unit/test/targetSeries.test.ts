import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { bindActiveSeries, deepFreeze } from '../buz/bindActiveSeries.buzz.js'
import { TargetModel } from '../target.model.js'
import * as loreBuzz from '../../00.lore.unit/buz/lore.buzz.js'

describe('Phase 6 Target Series Binding & Sower Synchronization', () => {
    const testRoot = path.join(process.cwd(), '.tmp_test_target_series')
    const seriesSlug = 'wiregrass-basin'

    beforeEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        vi.spyOn(loreBuzz, 'resolveRepoRoot').mockReturnValue(testRoot)

        const seriesDir = path.join(testRoot, 'series', seriesSlug)
        fs.mkdirSync(seriesDir, { recursive: true })
        fs.mkdirSync(path.join(testRoot, 'compiled', seriesSlug), {
            recursive: true,
        })

        // Mock series.config.json
        fs.writeFileSync(
            path.join(seriesDir, 'series.config.json'),
            JSON.stringify({
                series_slug: seriesSlug,
                display_name: 'Wiregrass Basin',
                genre_tag: 'SOUTHERN_GOTHIC_INDUSTRIAL',
            }) + '\n',
        )

        // Mock compiled bible-state.json
        fs.writeFileSync(
            path.join(testRoot, 'compiled', seriesSlug, 'bible-state.json'),
            JSON.stringify({
                _meta: {
                    state_hash:
                        '9f8e2a1b4c7d6e50f3b90a8c2e4157d6b812f9e0a4c7b8d1e2f3a4b5c6d7e8f9',
                    entity_counts: {
                        characters: 1,
                        locations: 1,
                        possessions: 1,
                        grievances: 1,
                        total: 4,
                    },
                },
            }) + '\n',
        )
    })

    afterEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        vi.restoreAllMocks()
    })

    it('bindActiveSeries: loads config, deep-freezes state, and synchronizes Sower model', async () => {
        const model = new TargetModel()
        let result: any = null
        const bal = {
            idx: 'test-target',
            src: seriesSlug,
            slv: (res: any) => {
                result = res
            },
        }

        await bindActiveSeries(model, bal as any, {} as any)

        expect(result.targetBit.val).toBe(1)
        expect(model.activeSeriesSlug).toBe(seriesSlug)
        expect(model.activeMerkleRoot).toBe(
            '9f8e2a1b4c7d6e50f3b90a8c2e4157d6b812f9e0a4c7b8d1e2f3a4b5c6d7e8f9',
        )
        expect(model.sowerEngineSynced).toBe(true)
        expect(model.themeColor).toBe('yellow')
        expect(Object.isFrozen(model.activeSeriesConfig)).toBe(true)
    })

    it('bindActiveSeries: fails closed if series.config.json is absent', async () => {
        const model = new TargetModel()
        let result: any = null
        const bal = {
            idx: 'test-target',
            src: 'non-existent-series',
            slv: (res: any) => {
                result = res
            },
        }

        await bindActiveSeries(model, bal as any, {} as any)
        expect(result.targetBit.val).toBe(0)
        expect(result.targetBit.dat.error).toBe('CONFIG_NOT_FOUND')
    })

    it('deepFreeze: recursively prevents property mutations', () => {
        const mutable = { a: 1, nested: { b: 2 } }
        const frozen = deepFreeze(mutable)

        expect(Object.isFrozen(frozen)).toBe(true)
        expect(Object.isFrozen(frozen.nested)).toBe(true)
        expect(() => {
            ;(frozen as any).a = 99
        }).toThrow()
        expect(() => {
            ;(frozen.nested as any).b = 99
        }).toThrow()
    })
})
