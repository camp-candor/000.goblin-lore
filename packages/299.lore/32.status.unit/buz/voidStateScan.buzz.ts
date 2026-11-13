import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type { StatusModel } from '../status.model.js'
import type StatusBit from '../fce/status.bit.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import type { VoidScanResultBit } from '../fce/voidScan.bit.js'

export const scanVoidState = (repoRootInput?: string): VoidScanResultBit => {
    const repoRoot = repoRootInput || resolveRepoRoot()
    const seriesPath = path.join(repoRoot, 'series')

    if (!fs.existsSync(seriesPath)) {
        return {
            isVoidState: true,
            discoveredSlugs: [],
            repoRoot,
            seriesPath,
        }
    }

    const entries = fs.readdirSync(seriesPath, { withFileTypes: true })
    const discoveredSlugs: string[] = []

    for (const entry of entries) {
        if (entry.isDirectory()) {
            const configPath = path.join(
                seriesPath,
                entry.name,
                'series.config.json',
            )
            if (fs.existsSync(configPath)) {
                try {
                    const raw = fs.readFileSync(configPath, 'utf-8')
                    if (raw.trim().length > 0) {
                        const parsed = JSON.parse(raw)
                        if (
                            parsed &&
                            typeof parsed === 'object' &&
                            !Array.isArray(parsed)
                        ) {
                            discoveredSlugs.push(entry.name)
                        }
                    }
                } catch {
                    // ignore
                }
            }
        }
    }

    discoveredSlugs.sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))

    return {
        isVoidState: discoveredSlugs.length === 0,
        discoveredSlugs,
        repoRoot,
        seriesPath,
    }
}

export const voidStateScan = async (
    cpy: StatusModel,
    bal: StatusBit,
    ste?: State,
): Promise<StatusModel> => {
    const targetRoot = (bal as any)?.src || undefined
    const result = scanVoidState(targetRoot)

    cpy.isVoidState = result.isVoidState
    cpy.discoveredSlugs = [...result.discoveredSlugs]
    cpy.dispatchLockEngaged = result.isVoidState
    cpy.activeBorderColor = result.isVoidState ? 'amber' : 'green'

    if (bal?.slv) {
        bal.slv({
            statusBit: {
                idx: 'void-state-scan',
                val: result.isVoidState ? 1 : 0,
                dat: result,
            },
        })
    }

    return cpy
}
