import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type { SeedModel } from '../seed.model.js'
import type SeedBit from '../fce/seed.bit.js'
import type {
    CreatedSeedDossier,
    PopulateGenesisSeedsReceipt,
} from '../fce/seed.bit.js'
import { seedWorldDefinitions } from './seedWorldDefinitions.buzz.js'
import { seedOriginHub } from './seedOriginHub.buzz.js'

export function resolveRepoRoot(startDir: string = process.cwd()): string {
    let curr = path.resolve(startDir)
    for (let i = 0; i < 6; i++) {
        if (
            fs.existsSync(path.join(curr, 'series')) ||
            fs.existsSync(path.join(curr, 'packages')) ||
            fs.existsSync(path.join(curr, 'package.json'))
        ) {
            return curr
        }
        const parent = path.dirname(curr)
        if (parent === curr) break
        curr = parent
    }
    return path.resolve(startDir)
}

async function emitConsole(
    ste: State | undefined,
    line: string,
): Promise<void> {
    if (ste && typeof ste.hunt === 'function') {
        await ste
            .hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: line,
            })
            .catch(() => {})
    }
}

/**
 * Orchestrates seeding of baseline world definitions and origin location.
 */
export const populateGenesisSeeds = async (
    cpy: SeedModel,
    bal: SeedBit,
    ste?: State,
): Promise<SeedModel> => {
    const payload = bal.dat || {}
    const seriesSlug = bal.src || payload.seriesSlug

    if (!seriesSlug) {
        const errorMsg = 'MISSING_SERIES_SLUG'
        await emitConsole(ste, `>> [FAIL] populateGenesisSeeds: ${errorMsg}`)
        if (bal.slv) {
            bal.slv({
                seedBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: errorMsg },
                },
            })
        }
        return cpy
    }

    const repoRoot = payload.repoRoot || resolveRepoRoot()
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)

    if (!fs.existsSync(seriesDir)) {
        const errorMsg = `SERIES_DIRECTORY_NOT_FOUND: ${seriesDir}`
        await emitConsole(ste, `>> [FAIL] populateGenesisSeeds: ${errorMsg}`)
        if (bal.slv) {
            bal.slv({
                seedBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: errorMsg },
                },
            })
        }
        return cpy
    }

    try {
        const seededFiles: CreatedSeedDossier[] = []

        // 1. Seed world/conditions.md and world/economy.md
        const worldDocs = seedWorldDefinitions(seriesDir, seriesSlug)
        seededFiles.push(...worldDocs)
        for (const doc of worldDocs) {
            await emitConsole(
                ste,
                `>> [SEED] World definition seeded: ${doc.id}`,
            )
        }

        // 2. Seed locations/loc_origin_hub.md
        const hubDoc = seedOriginHub(seriesDir, seriesSlug)
        seededFiles.push(hubDoc)
        await emitConsole(ste, `>> [SEED] Location seeded: ${hubDoc.id}`)

        const receipt: PopulateGenesisSeedsReceipt = {
            seriesSlug,
            seededFiles,
            totalSeeded: seededFiles.length,
            initialized: true,
        }

        await emitConsole(
            ste,
            `>> [OK] Genesis seed dossiers populated for '${seriesSlug}'. Total: ${seededFiles.length}`,
        )

        if (bal.slv) {
            bal.slv({
                seedBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: receipt,
                },
            })
        }
    } catch (err: any) {
        const errorMsg = err?.message || String(err)
        await emitConsole(ste, `>> [FAIL] populateGenesisSeeds: ${errorMsg}`)
        if (bal.slv) {
            bal.slv({
                seedBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: errorMsg },
                },
            })
        }
    }

    return cpy
}
