import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import matter from 'gray-matter'
import { orchestrateGenesisSeeds } from '../buz/orchestrateGenesisSeeds.buzz.js'
import { SeedModel } from '../seed.model.js'
import * as loreBuzz from '../../00.lore.unit/buz/lore.buzz.js'

describe('orchestrateGenesisSeeds', () => {
    const testRoot = path.join(process.cwd(), '.tmp_test_seeds')
    const seriesSlug = 'test-basin'

    beforeEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        fs.mkdirSync(path.join(testRoot, 'series', seriesSlug, 'characters'), {
            recursive: true,
        })
        fs.mkdirSync(path.join(testRoot, 'series', seriesSlug, 'locations'), {
            recursive: true,
        })
        fs.mkdirSync(path.join(testRoot, 'series', seriesSlug, 'possessions'), {
            recursive: true,
        })
        fs.mkdirSync(path.join(testRoot, 'series', seriesSlug, 'grievances'), {
            recursive: true,
        })
        vi.spyOn(loreBuzz, 'resolveRepoRoot').mockReturnValue(testRoot)
    })

    afterEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        vi.restoreAllMocks()
    })

    it('emits all 4 starter seed dossiers opening strictly at Byte Offset 0', async () => {
        const model = new SeedModel()
        let result: any = null
        const bal = {
            idx: 'test-seed',
            src: seriesSlug,
            slv: (res: any) => {
                result = res
            },
        }

        await orchestrateGenesisSeeds(model, bal as any, {} as any)

        expect(result.seedBit.val).toBe(1)
        expect(result.seedBit.dat.result.totalWritten).toBe(4)

        const dossiers = result.seedBit.dat.result.dossiers
        for (const d of dossiers) {
            expect(d.byteZeroVerified).toBe(true)
            const rawBytes = fs.readFileSync(d.absolutePath)
            expect(rawBytes[0]).toBe(0x2d)
            expect(rawBytes[1]).toBe(0x2d)
            expect(rawBytes[2]).toBe(0x2d)
        }
    })

    it('ensures referential integrity across the 4 generated seed dossiers', async () => {
        const model = new SeedModel()
        let result: any = null
        const bal = {
            idx: 'test-seed',
            src: seriesSlug,
            slv: (res: any) => {
                result = res
            },
        }

        await orchestrateGenesisSeeds(model, bal as any, {} as any)

        const seriesPath = path.join(testRoot, 'series', seriesSlug)
        const hub = matter(
            fs.readFileSync(
                path.join(seriesPath, 'locations', 'loc_origin_hub.md'),
                'utf-8',
            ),
        )
        const token = matter(
            fs.readFileSync(
                path.join(seriesPath, 'possessions', 'item_founder_token.md'),
                'utf-8',
            ),
        )
        const protagonist = matter(
            fs.readFileSync(
                path.join(seriesPath, 'characters', 'char_protagonist.md'),
                'utf-8',
            ),
        )
        const grievance = matter(
            fs.readFileSync(
                path.join(
                    seriesPath,
                    'grievances',
                    'grv_territorial_impasse.md',
                ),
                'utf-8',
            ),
        )

        expect(hub.data.id).toBe('loc_origin_hub')
        expect(token.data.custody_holder).toBe('char_protagonist')
        expect(protagonist.data.staged_location_id).toBe('loc_origin_hub')
        expect(protagonist.data.inventory.held_primary).toBe(
            'item_founder_token',
        )
        expect(grievance.data.location_anchor).toBe('loc_origin_hub')
        expect(grievance.data.physical_anchor_prop).toBe('item_founder_token')
        expect(grievance.data.participants_primary).toContain(
            'char_protagonist',
        )
    })
})
