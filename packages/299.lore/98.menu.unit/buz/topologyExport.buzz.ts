import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type TopologyExportBit from '../fce/topologyExport.bit.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { resolveLibraryBus } from './blessedModal.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

function emitConsole(ste: State | undefined, line: string): void {
    const cleanLine = String(line || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
    const lib = resolveLibraryBus()
    if (lib && typeof lib.hunt === 'function') {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: cleanLine })
        return
    }
    if (ste && typeof ste.hunt === 'function') {
        ste.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: cleanLine })
    }
}

export const exportStaticTopologyManifest = async (
    cpy: any,
    bal: TopologyExportBit,
    ste?: State,
): Promise<any> => {
    const dat = (bal as any).dat || {}
    const seriesSlug =
        (bal as any).src || dat.seriesSlug || 'gotham-trinity-crisis'
    const repoRoot = resolveRepoRoot()

    const compiledBiblePath = path.resolve(
        repoRoot,
        'compiled',
        seriesSlug,
        'bible-state.json',
    )

    if (!fs.existsSync(compiledBiblePath)) {
        const err = `[TOPOLOGY_EXPORT_ERROR] Compiled bible-state.json not found at ${compiledBiblePath}.`
        emitConsole(ste, `:: ${err}`)
        if (bal.slv) {
            bal.slv({
                topBit: {
                    idx: 'export-topology-fail',
                    val: -1,
                    dat: { error: err },
                },
            })
        }
        return cpy
    }

    emitConsole(
        ste,
        `>> [TOPOLOGY:EXPORT] Extracting static room geometry manifest for '${seriesSlug}'...`,
    )

    try {
        const bibleContent = fs.readFileSync(compiledBiblePath, 'utf-8')
        const bibleState = JSON.parse(bibleContent)
        const rawEntities = bibleState?.entities || {}
        const locations =
            rawEntities.locations && typeof rawEntities.locations === 'object'
                ? rawEntities.locations
                : Object.fromEntries(
                      Object.entries<any>(rawEntities).filter(
                          ([locId, locData]) =>
                              locData?.entity_type === 'location' ||
                              locId.startsWith('loc_'),
                      ),
                  )

        const spatialNodes: Record<string, any> = {}
        let nodeCount = 0

        for (const [locId, locData] of Object.entries<any>(locations)) {
            spatialNodes[locId] = {
                locationId: locId,
                displayName: locData.title || locId,
                adjacentLocations:
                    locData.adjacent_locations || locData.adjacent_to || [],
                acousticDampingFactor:
                    locData.acoustic_damping_cdb ??
                    locData.acoustic_dampening_cdb ??
                    1500,
                lightingLevel: locData.lighting_level || 'INCANDESCENT',
                volumeCapacity: {
                    maxAdultGoblins:
                        locData.max_adult_goblins ??
                        locData.occupancy_limit ??
                        2,
                    isCramped: Boolean(locData.is_cramped),
                },
            }
            nodeCount++
        }

        const topologyManifest = {
            schema_version: '1.0.0',
            series_slug: seriesSlug,
            merkle_root:
                bibleState?._meta?.state_hash ||
                bibleState?.root_merkle_hash ||
                '0'.repeat(64),
            nodes: spatialNodes,
            timestamp: new Date().toISOString(),
        }

        const parentDir = path.resolve(repoRoot, '..')
        const targetSpatialRoot =
            dat.targetSpatialRoot || path.join(parentDir, '000.goblin-spatial')

        if (!fs.existsSync(targetSpatialRoot)) {
            emitConsole(
                ste,
                `>> [TOPOLOGY:WARN] Sibling repository 000.goblin-spatial not found at ${targetSpatialRoot}`,
            )
            if (bal.slv) {
                bal.slv({
                    topBit: {
                        idx: 'export-topology-no-spatial',
                        val: 0,
                        dat: { topologyManifest, nodeCount },
                    },
                })
            }
            return cpy
        }

        const spatialDestination = path.join(
            targetSpatialRoot,
            'manifests',
            `${seriesSlug}-topology.json`,
        )
        fs.mkdirSync(path.dirname(spatialDestination), { recursive: true })
        fs.writeFileSync(
            spatialDestination,
            JSON.stringify(topologyManifest, null, 2),
            'utf-8',
        )

        emitConsole(
            ste,
            `>> [TOPOLOGY:EXPORT] [OK] Exported ${nodeCount} node(s) into 000.goblin-spatial/manifests/${seriesSlug}-topology.json`,
        )

        if (bal.slv) {
            bal.slv({
                topBit: {
                    idx: 'export-topology-success',
                    val: 1,
                    src: seriesSlug,
                    dat: {
                        exported: true,
                        seriesSlug,
                        spatialDestination,
                        nodeCount,
                        timestamp: topologyManifest.timestamp,
                    },
                },
            })
        }
    } catch (err: any) {
        const errorMsg = err.message || String(err)
        emitConsole(
            ste,
            `:: [TOPOLOGY_FAULT] Topology export failed: ${errorMsg}`,
        )
        if (bal.slv) {
            bal.slv({
                topBit: {
                    idx: 'export-topology-error',
                    val: -1,
                    dat: { error: errorMsg },
                },
            })
        }
    }

    return cpy
}
