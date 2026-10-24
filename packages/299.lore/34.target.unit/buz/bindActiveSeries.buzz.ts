import * as fs from 'node:fs'
import * as path from 'node:path'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import { applyGenreTheme } from '../../32.status.unit/buz/applyGenreTheme.buzz.js'
import { refreshSealedHud } from '../../32.status.unit/buz/refreshSealedHud.buzz.js'
import type { TargetModel } from '../target.model.js'
import type {
    TargetSeriesBit,
    TargetSeriesPayload,
} from '../fce/targetSeries.bit.js'
import type State from '../../99.core/state.js'

export function deepFreeze<T>(obj: T): Readonly<T> {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }
    Object.freeze(obj)
    for (const key of Object.getOwnPropertyNames(obj)) {
        const val = (obj as any)[key]
        if (val !== null && typeof val === 'object' && !Object.isFrozen(val)) {
            deepFreeze(val)
        }
    }
    return obj as Readonly<T>
}

export const bindActiveSeries = async (
    cpy: TargetModel,
    bal: TargetSeriesBit,
    ste?: State,
): Promise<TargetModel> => {
    const seriesSlug = bal.src || bal.dat?.seriesSlug
    if (!seriesSlug) {
        await emitBusConsoleLog(
            'cns00',
            '>> [FAIL] bindActiveSeries: Missing series slug.',
        )
        if (bal.slv)
            bal.slv({
                targetBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'MISSING_SERIES_SLUG' },
                },
            })
        return cpy
    }

    const repoRoot = resolveRepoRoot()
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)
    const configPath = path.join(seriesDir, 'series.config.json')
    const compiledPath = path.join(
        repoRoot,
        'compiled',
        seriesSlug,
        'bible-state.json',
    )

    if (!fs.existsSync(configPath)) {
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] Series config not found: ${configPath}`,
        )
        if (bal.slv)
            bal.slv({
                targetBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'CONFIG_NOT_FOUND' },
                },
            })
        return cpy
    }

    if (!fs.existsSync(compiledPath)) {
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] Compiled bible-state.json not found: ${compiledPath}`,
        )
        if (bal.slv)
            bal.slv({
                targetBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: 'BIBLE_STATE_NOT_FOUND' },
                },
            })
        return cpy
    }

    try {
        const rawConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
        const frozenConfig = deepFreeze(rawConfig)

        const compiledState = JSON.parse(fs.readFileSync(compiledPath, 'utf-8'))
        const merkleRoot =
            compiledState?._meta?.state_hash ||
            '0000000000000000000000000000000000000000000000000000000000000000'
        const counts = compiledState?._meta?.entity_counts || {
            characters: 0,
            locations: 0,
            possessions: 0,
            grievances: 0,
            total: 0,
        }

        const genreTag = frozenConfig.genre_tag || 'SOUTHERN_GOTHIC_INDUSTRIAL'

        // 1. Apply Genre Theme to Blessed Curses UI
        const themeResult = await applyGenreTheme(genreTag)

        // 2. Update Model State
        cpy.activeSeriesSlug = seriesSlug
        cpy.activeSeriesConfig = frozenConfig
        cpy.activeMerkleRoot = merkleRoot
        cpy.entityCounts = counts
        cpy.themeColor = themeResult.themeColor
        cpy.sowerEngineSynced = true

        // 3. Refresh Blessed Status HUD (Cols 4-12, Rows 0-3)
        await refreshSealedHud({
            seriesSlug,
            genreTag,
            merkleRoot,
            themeColor: themeResult.themeColor,
        })

        // 4. Stream Sower Engine Synchronized Receipts
        await emitBusConsoleLog(
            'cns00',
            `>> [SERIES: ${seriesSlug}] Canon bound. State hash: ${merkleRoot.slice(0, 16)}...`,
        )
        await emitBusConsoleLog(
            'cns00',
            `>> [SOWER::SYNC] Target series bound: '${seriesSlug}' (H_root: ${merkleRoot.slice(0, 16)}...)`,
        )
        await emitBusConsoleLog(
            'cns00',
            `>> [SOWER::SYNC] Relational entities active: ${counts.total} (Chars: ${counts.characters}, Locs: ${counts.locations}, Props: ${counts.possessions}, Grvs: ${counts.grievances})`,
        )
        await emitBusConsoleLog(
            'cns00',
            '>> [OK] Directorial dispatch lockout disarmed.',
        )

        const payload: TargetSeriesPayload = {
            seriesSlug,
            displayName: frozenConfig.display_name || seriesSlug,
            genreTag,
            themeColor: themeResult.themeColor,
            seriesConfig: frozenConfig,
            merkleRoot,
            entityCounts: counts,
            sowerEngineSynced: true,
        }

        if (bal.slv) {
            bal.slv({
                targetBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: { result: payload },
                },
            })
        }
    } catch (err: any) {
        const errorMsg = err?.message || String(err)
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] bindActiveSeries error: ${errorMsg}`,
        )
        if (bal.slv)
            bal.slv({
                targetBit: { idx: bal.idx, val: 0, dat: { error: errorMsg } },
            })
    }

    return cpy
}
