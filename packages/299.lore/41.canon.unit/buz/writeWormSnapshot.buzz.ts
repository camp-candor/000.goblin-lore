import * as fs from 'node:fs'
import * as path from 'node:path'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import type { CanonicalBibleState } from '../fce/compileGenesis.bit.js'

export interface WormSnapshotResult {
    readonly passed: boolean
    readonly wormPath: string
    readonly error?: string
}

export const writeWormSnapshot = (
    seriesSlug: string,
    compiledState: CanonicalBibleState,
): WormSnapshotResult => {
    const repoRoot = resolveRepoRoot()
    const compiledDir = path.join(repoRoot, 'compiled', seriesSlug)

    // Format Windows/NTFS-safe timestamp (replacing ':' with '-')
    const safeTimestamp = new Date().toISOString().replace(/:/g, '-')
    const wormFilename = `bible-state_${safeTimestamp}.json`
    const wormPath = path.join(compiledDir, wormFilename)
    const tempWormPath = path.join(compiledDir, `.tmp_${wormFilename}`)

    try {
        const canonicalJson = JSON.stringify(compiledState, null, 2) + '\n'
        fs.writeFileSync(tempWormPath, canonicalJson, { encoding: 'utf-8' })
        fs.renameSync(tempWormPath, wormPath)

        return {
            passed: true,
            wormPath,
        }
    } catch (err: any) {
        if (fs.existsSync(tempWormPath)) {
            try {
                fs.unlinkSync(tempWormPath)
            } catch {}
        }
        return {
            passed: false,
            wormPath: '',
            error: `WORM_WRITE_FAILURE: ${err?.message || String(err)}`,
        }
    }
}
