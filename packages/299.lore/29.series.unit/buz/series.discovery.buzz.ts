import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type SeriesDiscoveryBit from '../fce/seriesDiscovery.bit.js'
import { resolveRepoRoot } from './scaffoldSeriesTree.buzz.js'
import type { VoidScanResultBit } from '../fce/seriesDiscovery.bit.js'

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
                    // Ignore unparseable configs
                }
            }
        }
    }

    discoveredSlugs.sort((a, b) =>
        a === 'under-the-floorboards'
            ? -1
            : b === 'under-the-floorboards'
              ? 1
              : a.localeCompare(b),
    )

    return {
        isVoidState: discoveredSlugs.length === 0,
        discoveredSlugs: Object.freeze(discoveredSlugs) as readonly string[],
        repoRoot,
        seriesPath,
    }
}

export const listDiscoveredSeriesAction = async (
    cpy: any,
    bal: SeriesDiscoveryBit,
    _ste?: State,
): Promise<any> => {
    const repoRoot = (bal as any).src || (bal as any).dat?.repoRoot
    const scanResult = scanVoidState(repoRoot)

    if (bal.slv) {
        bal.slv({
            seriesBit: {
                idx: bal.idx,
                val: scanResult.isVoidState ? 0 : 1,
                dat: scanResult,
            },
        })
    }

    return cpy
}
