import * as fs from 'node:fs'
import * as path from 'node:path'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'
import { sanitizeSeriesSlug } from '../val/seriesSlug.val.js'
import type {
    SlugCollisionGuardOptionsBit,
    SlugCollisionGuardResultBit,
    SlugCollisionGuardOccupiedBit,
} from '../fce/slugCollisionGuard.bit.js'
import type { SeriesModel } from '../series.model.js'
import type SeriesBit from '../fce/series.bit.js'
import type State from '../../99.core/state.js'

/**
 * Pure filesystem inspector verifying that a series slug has not yet claimed
 * directories in either series/<slug> or compiled/<slug>.
 */
export const assertSeriesNamespaceVacant = (
    repoRoot: string,
    rawSlug: string,
): SlugCollisionGuardResultBit => {
    const slug = sanitizeSeriesSlug(rawSlug)
    const seriesPath = path.resolve(repoRoot, 'series', slug)
    const compiledPath = path.resolve(repoRoot, 'compiled', slug)

    const collidedPaths: string[] = []

    if (fs.existsSync(seriesPath)) {
        collidedPaths.push(seriesPath)
    }
    if (fs.existsSync(compiledPath)) {
        collidedPaths.push(compiledPath)
    }

    if (collidedPaths.length > 0) {
        return {
            isVacant: false,
            slug,
            seriesPath,
            compiledPath,
            collidedPaths,
            errorCode: 'CONFLICT_BLOCKED',
            message: `Series namespace collision: '${slug}' already exists on disk.`,
        }
    }

    return {
        isVacant: true,
        slug,
        seriesPath,
        compiledPath,
    }
}

/**
 * Asynchronous buzzer handling CHECK_SERIES_SLUG_AVAILABILITY dispatches from the bus.
 */
export const checkSeriesSlugAvailabilityBuzz = async (
    cpy: SeriesModel,
    bal: SeriesBit,
    _ste: State,
): Promise<SeriesModel> => {
    const repoRoot = bal?.dat?.repoRoot || resolveRepoRoot()
    const rawSlug = bal?.src || ''

    const check = assertSeriesNamespaceVacant(repoRoot, rawSlug)

    if (!check.isVacant) {
        const failure = check as SlugCollisionGuardOccupiedBit
        await emitBusConsoleLog(
            'cns00',
            `>> [FAIL] SLUG_COLLISION: Series '${failure.slug}' already exists in series/.`,
        )
        await emitBusConsoleLog(
            'cns00',
            `>> [GUARD] Collided path: ${failure.collidedPaths.join(', ')}`,
        )

        if (bal?.slv != null) {
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 0,
                    src: check.slug,
                    dat: check,
                },
            })
        }
        return cpy
    }

    await emitBusConsoleLog(
        'cns00',
        `>> [OK] SLUG_AVAILABLE: Namespace '${check.slug}' is vacant and ready for genesis.`,
    )

    if (bal?.slv != null) {
        bal.slv({
            seriesBit: {
                idx: bal.idx,
                val: 1,
                src: check.slug,
                dat: check,
            },
        })
    }

    return cpy
}
