import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type FleetPublishBit from '../fce/fleetPublish.bit.js'
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

export const publishSealedCanonToFleet = async (
    cpy: any,
    bal: FleetPublishBit,
    ste?: State,
): Promise<any> => {
    const dat = (bal as any).dat || {}
    const seriesSlug =
        (bal as any).src || dat.seriesSlug || 'gotham-trinity-crisis'
    const repoRoot = resolveRepoRoot()

    const sourceManifest = path.resolve(
        repoRoot,
        'compiled',
        seriesSlug,
        'bible-state.json',
    )

    if (!fs.existsSync(sourceManifest)) {
        const err = `[PUBLISH_ERROR] Compiled manifest not found at ${sourceManifest}. Run COMPILE LORE INSTANCE first.`
        emitConsole(ste, `:: ${err}`)
        if (bal.slv) {
            bal.slv({
                pubBit: {
                    idx: 'publish-fleet-fail',
                    val: -1,
                    dat: { error: err },
                },
            })
        }
        return cpy
    }

    emitConsole(
        ste,
        `>> [FLEET:PUBLISH] Broadcasting sealed canon '${seriesSlug}' across simulation fleet...`,
    )

    const parentDir = path.resolve(repoRoot, '..')
    const targetEngineRoot =
        dat.targetEngineRoot || path.join(parentDir, '000.series-sower-engine')
    const targetSpatialRoot =
        dat.targetSpatialRoot || path.join(parentDir, '000.goblin-spatial')

    let engineDestination = ''
    let spatialDestination = ''

    try {
        if (fs.existsSync(targetEngineRoot)) {
            engineDestination = path.join(
                targetEngineRoot,
                'compiled',
                seriesSlug,
                'bible-state.json',
            )
            fs.mkdirSync(path.dirname(engineDestination), { recursive: true })
            fs.copyFileSync(sourceManifest, engineDestination)
            emitConsole(
                ste,
                `>> [ENGINE:SYNC] [OK] Staged canon into 000.series-sower-engine`,
            )
        } else {
            emitConsole(
                ste,
                `>> [ENGINE:SYNC] [WARN] Sibling repo 000.series-sower-engine not found at ${targetEngineRoot}`,
            )
        }

        if (fs.existsSync(targetSpatialRoot)) {
            spatialDestination = path.join(
                targetSpatialRoot,
                'manifests',
                `${seriesSlug}-topology.json`,
            )
            fs.mkdirSync(path.dirname(spatialDestination), { recursive: true })
            fs.copyFileSync(sourceManifest, spatialDestination)
            emitConsole(
                ste,
                `>> [SPATIAL:SYNC] [OK] Exported room topology manifest into 000.goblin-spatial`,
            )
        } else {
            emitConsole(
                ste,
                `>> [SPATIAL:SYNC] [WARN] Sibling repo 000.goblin-spatial not found at ${targetSpatialRoot}`,
            )
        }

        emitConsole(
            ste,
            `>> [FLEET:PUBLISH] [OK] Fleet broadcast successfully sealed and completed.`,
        )

        if (bal.slv) {
            bal.slv({
                pubBit: {
                    idx: 'publish-fleet-success',
                    val: 1,
                    src: seriesSlug,
                    dat: {
                        published: true,
                        seriesSlug,
                        engineDestination,
                        spatialDestination,
                        timestamp: new Date().toISOString(),
                    },
                },
            })
        }
    } catch (err: any) {
        const errorMsg = err.message || String(err)
        emitConsole(
            ste,
            `:: [PUBLISH_FAULT] Fleet publication failed: ${errorMsg}`,
        )
        if (bal.slv) {
            bal.slv({
                pubBit: {
                    idx: 'publish-fleet-error',
                    val: -1,
                    dat: { error: errorMsg },
                },
            })
        }
    }

    return cpy
}
