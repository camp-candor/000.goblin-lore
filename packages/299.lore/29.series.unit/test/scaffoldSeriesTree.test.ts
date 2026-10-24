import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { scaffoldSeriesTree } from '../buz/scaffoldSeriesTree.buzz.js'
import { SeriesModel } from '../series.model.js'
import * as loreBuzz from '../../00.lore.unit/buz/lore.buzz.js'

describe('scaffoldSeriesTree', () => {
    const testRoot = path.join(process.cwd(), '.tmp_test_scaffold')

    beforeEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        fs.mkdirSync(testRoot, { recursive: true })
        vi.spyOn(loreBuzz, 'resolveRepoRoot').mockReturnValue(testRoot)
    })

    afterEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        vi.restoreAllMocks()
    })

    it('provisions all five domain subdirectories and ontology/unresolved.json', async () => {
        const model = new SeriesModel()
        let result: any = null
        const bal = {
            idx: 'test-tree',
            src: 'test-series',
            slv: (res: any) => {
                result = res
            },
        }

        await scaffoldSeriesTree(model, bal as any, {} as any)

        expect(result.seriesBit.val).toBe(1)
        const seriesDir = path.join(testRoot, 'series', 'test-series')
        expect(fs.existsSync(path.join(seriesDir, 'characters'))).toBe(true)
        expect(fs.existsSync(path.join(seriesDir, 'grievances'))).toBe(true)
        expect(fs.existsSync(path.join(seriesDir, 'locations'))).toBe(true)
        expect(fs.existsSync(path.join(seriesDir, 'possessions'))).toBe(true)
        expect(fs.existsSync(path.join(seriesDir, 'ontology'))).toBe(true)
        expect(
            fs.existsSync(path.join(testRoot, 'compiled', 'test-series')),
        ).toBe(true)

        const unresolved = path.join(seriesDir, 'ontology', 'unresolved.json')
        expect(fs.existsSync(unresolved)).toBe(true)
        expect(fs.readFileSync(unresolved, 'utf-8')).toBe('[]\n')
    })

    it('fails closed when series slug is missing', async () => {
        const model = new SeriesModel()
        let result: any = null
        const bal = {
            idx: 'test-tree',
            slv: (res: any) => {
                result = res
            },
        }

        await scaffoldSeriesTree(model, bal as any, {} as any)
        expect(result.seriesBit.val).toBe(0)
        expect(result.seriesBit.dat.error).toBe('MISSING_SERIES_SLUG')
    })
})
