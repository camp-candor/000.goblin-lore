import * as fs from 'node:fs'
import * as path from 'node:path'
import { SeriesModel } from '../series.model.js'
import type SeriesBit from '../fce/series.bit.js'
import type State from '../../99.core/state.js'
import {
    resolveArchetypeInheritance,
    SomaticArchetypeSchema,
} from '../val/archetype.val.js'
import { ZodError } from 'zod'
import { writeSeriesConfig } from './writeSeriesConfig.buzz.js'

export const initSeries = (
    cpy: SeriesModel,
    bal: SeriesBit,
    ste: State,
): SeriesModel => {
    if (bal.slv) {
        bal.slv({
            seriesBit: {
                idx: bal.idx,
                val: 1,
                dat: { initialized: true },
            },
        })
    }
    return cpy
}

export const updateSeries = (
    cpy: SeriesModel,
    bal: SeriesBit,
    ste: State,
): any => {
    if (bal.dat?.config) {
        return writeSeriesConfig(cpy, bal, ste)
    }
    if (bal.slv) {
        bal.slv({
            seriesBit: {
                idx: bal.idx,
                val: 1,
            },
        })
    }
    return cpy
}

export const resolveArchetype = (
    cpy: SeriesModel,
    bal: SeriesBit,
    ste: State,
): SeriesModel => {
    const archetypeId = bal.dat?.archetypeId ?? bal.dat?.delta?.archetype_id
    const delta = bal.dat?.delta

    try {
        if (!archetypeId) {
            throw new Error(
                '[ARCHETYPE_ID_REQUIRED]: No archetypeId provided in payload.',
            )
        }

        const archetype = cpy.archetypeRegistry[archetypeId]
        if (!archetype) {
            throw new Error(
                `[UNKNOWN_ARCHETYPE]: Archetype ID '${archetypeId}' not found in registry.`,
            )
        }

        const resolved = resolveArchetypeInheritance(archetype, delta)

        if (bal.slv) {
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: {
                        archetypeId,
                        resolvedProfile: resolved,
                        isValid: true,
                    },
                },
            })
        }
    } catch (error) {
        const errorMsg =
            error instanceof ZodError
                ? `[ARCHETYPE_VALIDATION_ERROR]: ${error.issues.map((i) => i.message).join(', ')}`
                : String(error)

        if (bal.slv) {
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: {
                        archetypeId,
                        isValid: false,
                        error: errorMsg,
                    },
                },
            })
        }
    }
    return cpy
}

export interface SeriesResolutionResult {
    readonly success: boolean
    readonly seriesSlug: string
    readonly seriesPath: string
    readonly repoRoot: string
    readonly message: string
}

/**
 * Traverses upward to locate the monorepo root containing the series directory.
 */
export function findRepoRoot(startDir: string = process.cwd()): string {
    let current = path.resolve(startDir)
    while (true) {
        const candidateSeriesDir = path.join(current, 'series')
        const candidatePackageJson = path.join(current, 'package.json')
        if (
            fs.existsSync(candidateSeriesDir) ||
            fs.existsSync(candidatePackageJson)
        ) {
            if (fs.existsSync(candidateSeriesDir)) {
                return current
            }
        }
        const parent = path.dirname(current)
        if (parent === current) {
            break
        }
        current = parent
    }
    return path.resolve(startDir)
}

/**
 * Resolves and binds the active series workspace path.
 */
export function resolveActiveSeriesDirBuzz(
    seriesSlug: string,
    explicitRepoRoot?: string,
): SeriesResolutionResult {
    const repoRoot = explicitRepoRoot
        ? path.resolve(explicitRepoRoot)
        : findRepoRoot()
    const seriesPath = path.join(repoRoot, 'series', seriesSlug)

    if (!fs.existsSync(seriesPath)) {
        return {
            success: false,
            seriesSlug,
            seriesPath,
            repoRoot,
            message: `[FAIL] :: Series directory does not exist: ${seriesPath}`,
        }
    }

    const model = SeriesModel.getInstance()
    model.setActiveSeries(seriesSlug, seriesPath, repoRoot)

    return {
        success: true,
        seriesSlug,
        seriesPath,
        repoRoot,
        message: `[OK] :: Active series bound to ${seriesPath}`,
    }
}
