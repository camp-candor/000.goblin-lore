import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import type State from '../../99.core/state.js'
import type FleetPublishBit from '../fce/fleetPublish.bit.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { resolveLibraryBus } from './blessedModal.buzz.js'
import { exportStaticTopologyManifest } from './topologyExport.buzz.js'

export interface PublishAutoScriptReadiness {
    ready: boolean
    ruleCount: number
    voiceCount: number
    locationCount: number
    outputSubdir: string
}

export function inspectPublishAutoScriptReadiness(
    parsedBibleState: any,
): PublishAutoScriptReadiness {
    const bundle = (parsedBibleState as any)?.auto_script_bundle
    const config = bundle?.config
    const rules = Array.isArray(config?.rules) ? config.rules : null
    if (!bundle || !config || !rules) {
        return {
            ready: false,
            ruleCount: 0,
            voiceCount: 0,
            locationCount: 0,
            outputSubdir: '',
        }
    }
    const voiceCount = bundle.voice_lexicon
        ? Object.keys(bundle.voice_lexicon).length
        : 0
    const locationCount = bundle.location_stage_profiles
        ? Object.keys(bundle.location_stage_profiles).length
        : 0
    const outputSubdir =
        typeof config.output_subdir === 'string' ? config.output_subdir : ''
    return {
        ready: true,
        ruleCount: rules.length,
        voiceCount,
        locationCount,
        outputSubdir,
    }
}

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

function atomicCopyFileSync(sourcePath: string, destinationPath: string): void {
    fs.mkdirSync(path.dirname(destinationPath), { recursive: true })
    const tmpPath = path.join(
        path.dirname(destinationPath),
        `.tmp_${process.pid}_${Date.now()}_bible-state.json`,
    )
    fs.copyFileSync(sourcePath, tmpPath)
    fs.renameSync(tmpPath, destinationPath)
}

export const publishSealedCanonToFleet = async (
    cpy: any,
    bal: FleetPublishBit,
    ste?: State,
): Promise<any> => {
    const dat = (bal as any)?.dat || {}
    const requestedSlug =
        (bal as any)?.src ||
        dat.seriesSlug ||
        cpy?.activeSeries ||
        'gotham-trinity-crisis'
    const repoRoot = resolveRepoRoot()

    let seriesSlug = requestedSlug
    let sourceManifest = path.resolve(
        repoRoot,
        'compiled',
        seriesSlug,
        'bible-state.json',
    )

    if (
        !fs.existsSync(sourceManifest) &&
        !(bal as any)?.src &&
        !dat.seriesSlug
    ) {
        const fallbackSlugs = [
            'gotham-trinity-crisis',
            'wiregrass-basin',
            'under-the-floorboards',
            'ashfall-basin',
        ]
        for (const candidate of fallbackSlugs) {
            const candidatePath = path.resolve(
                repoRoot,
                'compiled',
                candidate,
                'bible-state.json',
            )
            if (fs.existsSync(candidatePath)) {
                seriesSlug = candidate
                sourceManifest = candidatePath
                break
            }
        }
    }

    if (!fs.existsSync(sourceManifest)) {
        const err = `[PUBLISH_ERROR] Compiled manifest not found at ${sourceManifest}. Run COMPILE LORE INSTANCE first.`
        emitConsole(ste, `:: ${err}`)
        if (cpy && typeof cpy === 'object') {
            cpy.lastActionTimestamp = Date.now()
            cpy.statusMessage = 'FLEET_CANON_PUBLISH_FAILED'
            cpy.lastError = err
        }

        if (bal?.slv) {
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

    let parsedBibleState: any = null
    try {
        parsedBibleState = JSON.parse(fs.readFileSync(sourceManifest, 'utf-8'))
    } catch (parseErr: any) {
        const err = `[PUBLISH_ERROR] Compiled manifest at ${sourceManifest} failed JSON parse: ${parseErr?.message || String(parseErr)}`
        emitConsole(ste, `:: ${err}`)
        if (cpy && typeof cpy === 'object') {
            cpy.lastActionTimestamp = Date.now()
            cpy.statusMessage = 'FLEET_CANON_PUBLISH_FAILED'
            cpy.lastError = err
        }
        if (bal?.slv) {
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

    const chronology = parsedBibleState?.chronology
    if (chronology?.start_date && chronology?.start_time) {
        emitConsole(
            ste,
            `>> [PUBLISH:CHRONO] Exported start=${chronology.start_date} ${chronology.start_time} (${chronology.start_snapshot?.daypart || chronology.daypart || 'NIGHT'}) cadence=${chronology.tick_seconds}s`,
        )
    } else {
        emitConsole(
            ste,
            `:: [PUBLISH:WARN] Missing chronology seal -- recompile recommended`,
        )
    }

    const readiness = inspectPublishAutoScriptReadiness(parsedBibleState)
    if (readiness.ready) {
        emitConsole(
            ste,
            `>> [PUBLISH:AUTO_SCRIPT] Rules=${readiness.ruleCount} | Voices=${readiness.voiceCount} | Locations=${readiness.locationCount} | Output=${readiness.outputSubdir}`,
        )
    } else {
        emitConsole(
            ste,
            `:: [PUBLISH:WARN] Missing auto_script_bundle -- legacy seal; recompile recommended`,
        )
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
            atomicCopyFileSync(sourceManifest, engineDestination)
            const srcHash = crypto
                .createHash('sha256')
                .update(fs.readFileSync(sourceManifest))
                .digest('hex')
            const dstHash = crypto
                .createHash('sha256')
                .update(fs.readFileSync(engineDestination))
                .digest('hex')
            if (srcHash !== dstHash) {
                throw new Error(
                    `[PUBLISH_PARITY_MISMATCH] Source SHA-256 ${srcHash} != destination SHA-256 ${dstHash}.`,
                )
            }
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
            await exportStaticTopologyManifest(
                cpy,
                {
                    idx: 'fleet-publish-topology',
                    src: seriesSlug,
                    dat: { seriesSlug, targetSpatialRoot },
                },
                ste,
            )
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

        if (cpy && typeof cpy === 'object') {
            cpy.lastActionTimestamp = Date.now()
            cpy.statusMessage = 'FLEET_CANON_PUBLISHED'
            cpy.lastLifecycleReceipt = '[FLEET:PUBLISH:OK]'
        }

        if (bal?.slv) {
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
        if (cpy && typeof cpy === 'object') {
            cpy.lastActionTimestamp = Date.now()
            cpy.statusMessage = 'FLEET_CANON_PUBLISH_FAULT'
            cpy.lastError = errorMsg
        }

        if (bal?.slv) {
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
