import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import type State from '../../99.core/state.js'
import type { SeriesModel } from '../series.model.js'
import type SeriesBit from '../fce/series.bit.js'
import { SeriesConfigSchema } from '../fce/series.schema.js'
import type { ScaffoldSeriesTreeReceipt } from '../fce/series.bit.js'

/**
 * Traverses upward from process.cwd() to locate monorepo root.
 */
export function resolveRepoRoot(startDir: string = process.cwd()): string {
    let curr = path.resolve(startDir)
    for (let i = 0; i < 6; i++) {
        if (
            fs.existsSync(path.join(curr, 'AGENTS.md')) ||
            (fs.existsSync(path.join(curr, 'series')) &&
                fs.existsSync(path.join(curr, 'packages')))
        ) {
            return curr
        }
        const parent = path.dirname(curr)
        if (parent === curr) break
        curr = parent
    }
    curr = path.resolve(startDir)
    for (let i = 0; i < 6; i++) {
        if (
            fs.existsSync(path.join(curr, 'series')) ||
            fs.existsSync(path.join(curr, 'packages'))
        ) {
            return curr
        }
        const parent = path.dirname(curr)
        if (parent === curr) break
        curr = parent
    }
    return path.resolve(startDir)
}

/**
 * Emits 7-bit clean ASCII console telemetry to cns00 without blocking.
 */
function emitConsole(ste: State | undefined, line: string): void {
    // eslint-disable-next-line no-control-regex
    const clean = line.replace(/[^\x00-\x7F]/g, '')
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: clean,
        }).catch(() => {})
    } else if (ste && typeof ste.hunt === 'function') {
        try {
            ste.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: clean,
            }).catch(() => {})
        } catch {}
    }
}

/**
 * Atomically scaffolds a series directory tree and writes series.config.json.
 */
export const scaffoldSeriesTree = async (
    cpy: SeriesModel,
    bal: SeriesBit,
    ste?: State,
): Promise<SeriesModel> => {
    const payload = bal.dat || {}
    const rawConfig = payload.config || bal.dat
    const rawSlug = bal.src || payload.seriesSlug || rawConfig?.series_slug

    if (!rawSlug) {
        const errorMsg = 'MISSING_SERIES_SLUG'
        emitConsole(ste, `>> [FAIL] scaffoldSeriesTree: ${errorMsg}`)
        if (bal.slv) {
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: errorMsg },
                },
            })
        }
        return cpy
    }

    // 1. Validate Series Configuration Against Universal 4-Tuple Schema
    let validatedConfig: any
    try {
        validatedConfig = SeriesConfigSchema.parse(rawConfig)
    } catch (err: any) {
        const parseError = `SCHEMA_VALIDATION_FAILED: ${err.message}`
        emitConsole(ste, `>> [FAIL] scaffoldSeriesTree: ${parseError}`)
        if (bal.slv) {
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: parseError },
                },
            })
        }
        return cpy
    }

    const seriesSlug = validatedConfig.series_slug
    const repoRoot = payload.repoRoot || resolveRepoRoot()
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)
    const compiledDir = path.join(repoRoot, 'compiled', seriesSlug)

    // 2. Existing Series Namespace Collision Guard
    if (fs.existsSync(seriesDir) || fs.existsSync(compiledDir)) {
        const collisionError = `CONFLICT_BLOCKED: Namespace '${seriesSlug}' already exists on disk.`
        emitConsole(ste, `>> [FAIL] scaffoldSeriesTree: ${collisionError}`)
        if (bal.slv) {
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: collisionError, isVacant: false },
                },
            })
        }
        return cpy
    }

    const subdirectories = [
        'characters',
        'characters/_retired',
        'locations',
        'possessions',
        'grievances',
        'grievances/_retired',
        'ontology',
        'world',
    ]

    const createdDirectories: string[] = []

    try {
        // 3. Create Root Directory and Subdirectories
        fs.mkdirSync(seriesDir, { recursive: true })
        createdDirectories.push(seriesDir)

        for (const sub of subdirectories) {
            const targetSub = path.join(seriesDir, sub)
            if (!fs.existsSync(targetSub)) {
                fs.mkdirSync(targetSub, { recursive: true })
                createdDirectories.push(targetSub)
            }
        }

        if (!fs.existsSync(compiledDir)) {
            fs.mkdirSync(compiledDir, { recursive: true })
            createdDirectories.push(compiledDir)
        }

        // 4. Initialize ontology/unresolved.json with Validated Empty Mystery Array
        const unresolvedJsonPath = path.join(
            seriesDir,
            'ontology',
            'unresolved.json',
        )
        if (!fs.existsSync(unresolvedJsonPath)) {
            fs.writeFileSync(unresolvedJsonPath, '[]\n', { encoding: 'utf-8' })
        }

        // 5. Atomic POSIX Write of series.config.json
        const configPath = path.join(seriesDir, 'series.config.json')
        const tmpConfigPath = path.join(
            seriesDir,
            `.tmp_${crypto.randomUUID()}_series.config.json`,
        )
        const serializedConfig = JSON.stringify(validatedConfig, null, 2) + '\n'

        fs.writeFileSync(tmpConfigPath, serializedConfig, { encoding: 'utf-8' })
        fs.renameSync(tmpConfigPath, configPath)

        emitConsole(
            ste,
            `>> [TREE] Provisioned hermetic directory hierarchy for '${seriesSlug}'`,
        )

        const receipt: ScaffoldSeriesTreeReceipt = {
            seriesSlug,
            seriesDir,
            compiledDir,
            createdDirectories,
            configPath,
            unresolvedPath: unresolvedJsonPath,
            initialized: true,
        }

        if (cpy.activeConfigs) {
            cpy.activeConfigs[seriesSlug] = validatedConfig
        }

        if (bal.slv) {
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: receipt,
                },
            })
        }
    } catch (err: any) {
        const errorMsg = err?.message || String(err)
        emitConsole(ste, `>> [FAIL] scaffoldSeriesTree: ${errorMsg}`)
        if (bal.slv) {
            bal.slv({
                seriesBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: errorMsg },
                },
            })
        }
    }

    return cpy
}
