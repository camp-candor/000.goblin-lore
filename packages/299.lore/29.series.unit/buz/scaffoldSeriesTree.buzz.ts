import * as fs from 'node:fs'
import * as path from 'node:path'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type SeriesBit from '../fce/series.bit.js'
import type { SeriesModel } from '../series.model.js'
import type State from '../../99.core/state.js'

export const scaffoldSeriesTree = async (
    cpy: SeriesModel,
    bal: SeriesBit,
    _ste: State,
): Promise<SeriesModel> => {
    const seriesSlug = bal.src || bal.dat?.seriesSlug
    if (!seriesSlug) {
        await emitBusConsoleLog(
            'cns00',
            '>> [FAIL] scaffoldSeriesTree: Missing series slug.',
        )
        if (bal.slv)
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'MISSING_SERIES_SLUG' },
                },
            })
        return cpy
    }

    const repoRoot = bal.dat?.repoRoot || resolveRepoRoot()
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)
    const compiledDir = path.join(repoRoot, 'compiled', seriesSlug)

    const subdirectories = [
        'characters',
        'grievances',
        'locations',
        'possessions',
        'ontology',
    ]

    try {
        for (const sub of subdirectories) {
            const targetSub = path.join(seriesDir, sub)
            if (!fs.existsSync(targetSub)) {
                fs.mkdirSync(targetSub, { recursive: true })
            }
        }

        if (!fs.existsSync(compiledDir)) {
            fs.mkdirSync(compiledDir, { recursive: true })
        }

        // Initialize series/<slug>/ontology/unresolved.json with empty array
        const unresolvedJsonPath = path.join(
            seriesDir,
            'ontology',
            'unresolved.json',
        )
        if (!fs.existsSync(unresolvedJsonPath)) {
            fs.writeFileSync(unresolvedJsonPath, '[]\n', { encoding: 'utf-8' })
        }

        await emitBusConsoleLog(
            'cns00',
            `>> [TREE] Provisioned hermetic folders for '${seriesSlug}'`,
        )
        if (bal.slv) {
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: {
                        seriesSlug,
                        seriesDir,
                        compiledDir,
                        initialized: true,
                    },
                },
            })
        }
    } catch (err: any) {
        const errorMsg = err?.message || String(err)
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] scaffoldSeriesTree: ${errorMsg}`,
        )
        if (bal.slv)
            bal.slv({
                seriesBit: { idx: bal.idx, val: 0, dat: { error: errorMsg } },
            })
    }

    return cpy
}
