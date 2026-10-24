import * as fs from 'node:fs'
import * as path from 'node:path'
import {
    SeriesConfigSchema,
    type SeriesConfig,
} from '../val/seriesConfig.val.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import type SeriesBit from '../fce/series.bit.js'
import type { SeriesModel } from '../series.model.js'
import type State from '../../99.core/state.js'

export const writeSeriesConfig = async (
    cpy: SeriesModel,
    bal: SeriesBit,
    _ste: State,
): Promise<SeriesModel> => {
    const configInput = bal.dat?.config
    if (!configInput) {
        await emitBusConsoleLog(
            'cns00',
            '>> [FAIL] writeSeriesConfig: Missing config payload.',
        )
        if (bal.slv)
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'MISSING_PAYLOAD' },
                },
            })
        return cpy
    }

    const parseResult = SeriesConfigSchema.safeParse(configInput)
    if (!parseResult.success) {
        const errorDetails = parseResult.error.issues
            .map((i) => `${i.path.join('.')}: ${i.message}`)
            .join(', ')
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] writeSeriesConfig Zod validation failed: ${errorDetails}`,
        )
        if (bal.slv)
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: errorDetails },
                },
            })
        return cpy
    }

    const validConfig: SeriesConfig = parseResult.data
    const repoRoot = bal.dat?.repoRoot || resolveRepoRoot()
    const seriesDir = path.join(repoRoot, 'series', validConfig.series_slug)
    const targetPath = path.join(seriesDir, 'series.config.json')
    const tempPath = path.join(
        seriesDir,
        `.tmp_series.config.${Date.now()}.json`,
    )

    try {
        if (!fs.existsSync(seriesDir)) {
            fs.mkdirSync(seriesDir, { recursive: true })
        }

        const formattedJson = JSON.stringify(validConfig, null, 2) + '\n'
        fs.writeFileSync(tempPath, formattedJson, { encoding: 'utf-8' })
        fs.renameSync(tempPath, targetPath)

        await emitBusConsoleLog(
            'cns00',
            `>> [OK] Serialized series.config.json for '${validConfig.series_slug}'`,
        )
        if (bal.slv)
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: { filePath: targetPath, config: validConfig },
                },
            })
    } catch (err: any) {
        if (fs.existsSync(tempPath)) {
            try {
                fs.unlinkSync(tempPath)
            } catch {}
        }
        const message = err?.message || String(err)
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] writeSeriesConfig I/O Exception: ${message}`,
        )
        if (bal.slv)
            bal.slv({
                seriesBit: { idx: bal.idx, val: 0, dat: { error: message } },
            })
    }

    return cpy
}
