import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import type State from '../../99.core/state.js'
import type FleetPublishBit from '../fce/fleetPublish.bit.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import { resolveLibraryBus } from './blessedModal.buzz.js'
import { exportStaticTopologyManifest } from './topologyExport.buzz.js'
import {
    PacingBudgetConfigSchema,
    resolvePacingBudgetConfig,
    type PacingBudgetConfig,
} from '../../38.types.unit/fce/autoScriptRule.interface.js'
import { expandRecurrenceOccurrencesInHorizon } from '../../05.clock.unit/buz/clock.buzz.js'
import { normalizeBeatRecurrenceRule } from '../../38.types.unit/fce/chronology.interface.js'

export interface RecurrencePublishParity {
    readonly ok: boolean
    readonly rules: number
    readonly blackouts: number
    readonly next7dOccurrences: number
}

const WEEKDAY_ORDER_PUBLISH: readonly string[] = Object.freeze([
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
    'SUN',
])

const SOLAR_ORDER_PUBLISH: readonly string[] = Object.freeze([
    'VERNAL_EQUINOX',
    'SUMMER_SOLSTICE',
    'AUTUMN_EQUINOX',
    'WINTER_SOLSTICE',
])

function canonicalRulePublish(
    rule: Record<string, unknown>,
): Record<string, unknown> {
    const out: Record<string, unknown> = { ...(rule ?? {}) }
    const wRank = (w: string): number => {
        const i = WEEKDAY_ORDER_PUBLISH.indexOf(w)
        return i === -1 ? 99 : i
    }
    const sRank = (s: string): number => {
        const i = SOLAR_ORDER_PUBLISH.indexOf(s)
        return i === -1 ? 99 : i
    }
    if (Array.isArray((rule as { weekdayMask?: unknown }).weekdayMask)) {
        out['weekdayMask'] = [
            ...new Set((rule as { weekdayMask: string[] }).weekdayMask),
        ].sort((a, b) => wRank(a) - wRank(b))
    }
    if (Array.isArray((rule as { solarMarkers?: unknown }).solarMarkers)) {
        out['solarMarkers'] = [
            ...new Set((rule as { solarMarkers: string[] }).solarMarkers),
        ].sort((a, b) => sRank(a) - sRank(b))
    }
    if (Array.isArray((rule as { blackoutDates?: unknown }).blackoutDates)) {
        out['blackoutDates'] = [
            ...new Set((rule as { blackoutDates: string[] }).blackoutDates),
        ].sort()
    }
    if (
        Array.isArray((rule as { blackoutWeekdays?: unknown }).blackoutWeekdays)
    ) {
        out['blackoutWeekdays'] = [
            ...new Set(
                (rule as { blackoutWeekdays: string[] }).blackoutWeekdays,
            ),
        ].sort((a, b) => wRank(a) - wRank(b))
    }
    return out
}

function canonicalBeatsPublish(
    beats: Array<Record<string, unknown>>,
): Array<Record<string, unknown>> {
    return [...beats]
        .sort((a, b) =>
            String(a['beat_id']) < String(b['beat_id'])
                ? -1
                : String(a['beat_id']) > String(b['beat_id'])
                  ? 1
                  : 0,
        )
        .map((b) => {
            const rule = (b['recurrenceRule'] ??
                normalizeBeatRecurrenceRule(b as never)) as unknown as Record<
                string,
                unknown
            >
            return {
                beat_id: String(b['beat_id']),
                isoDate: String(b['isoDate']),
                startTimeHm: String(b['startTimeHm']),
                recurrenceRule: canonicalRulePublish(rule),
            }
        })
}

export function inspectPublishRecurrenceGrammarParity(
    seriesDir: string,
    ste?: State,
): RecurrencePublishParity {
    const configPath = path.join(seriesDir, 'series.config.json')
    let biblePath = path.join(seriesDir, 'bible-state.json')
    if (!fs.existsSync(biblePath)) {
        const alt = path.join(seriesDir, 'compiled', 'bible-state.json')
        if (fs.existsSync(alt)) biblePath = alt
    }
    if (!fs.existsSync(configPath)) {
        throw new Error(
            '[PUBLISH_RECURRENCE_DRIFT] series.config.json not found',
        )
    }
    if (!fs.existsSync(biblePath)) {
        const slug = path.basename(seriesDir)
        try {
            const root = resolveRepoRoot()
            const compiled = path.join(
                root,
                'compiled',
                slug,
                'bible-state.json',
            )
            if (fs.existsSync(compiled)) biblePath = compiled
        } catch {
            // ignore
        }
    }
    if (!fs.existsSync(biblePath)) {
        throw new Error(
            '[PUBLISH_RECURRENCE_DRIFT] bible-state.json not found for recurrence parity',
        )
    }
    const configRaw = JSON.parse(fs.readFileSync(configPath, 'utf8'))
    const bibleRaw = JSON.parse(fs.readFileSync(biblePath, 'utf8'))
    const configChrono =
        (configRaw?.chronology as Record<string, unknown>) ?? {}
    const bibleChrono = (bibleRaw?.chronology as Record<string, unknown>) ?? {}
    const configBlackouts: string[] = Array.isArray(
        (configChrono as { series_blackout_dates?: unknown })
            .series_blackout_dates,
    )
        ? ([
              ...((configChrono as { series_blackout_dates?: string[] })
                  .series_blackout_dates as string[]),
          ].sort() as string[])
        : []
    const bibleBlackouts: string[] = Array.isArray(
        (bibleChrono as { series_blackout_dates?: unknown })
            .series_blackout_dates,
    )
        ? ([
              ...((bibleChrono as { series_blackout_dates?: string[] })
                  .series_blackout_dates as string[]),
          ].sort() as string[])
        : []
    const configBeats = canonicalBeatsPublish(
        (Array.isArray(
            (configChrono as { scheduled_beats?: unknown }).scheduled_beats,
        )
            ? (
                  configChrono as {
                      scheduled_beats: Array<Record<string, unknown>>
                  }
              ).scheduled_beats
            : []) as Array<Record<string, unknown>>,
    )
    const bibleBeats = canonicalBeatsPublish(
        (Array.isArray(
            (bibleChrono as { scheduled_beats?: unknown }).scheduled_beats,
        )
            ? (
                  bibleChrono as {
                      scheduled_beats: Array<Record<string, unknown>>
                  }
              ).scheduled_beats
            : []) as Array<Record<string, unknown>>,
    )
    if (
        JSON.stringify(configBeats) !== JSON.stringify(bibleBeats) ||
        JSON.stringify(configBlackouts) !== JSON.stringify(bibleBlackouts)
    ) {
        emitConsole(
            ste,
            ':: [PUBLISH_RECURRENCE_DRIFT] Uncompiled recurrence edits detected; recompile before publish',
        )
        throw new Error(
            '[PUBLISH_RECURRENCE_DRIFT] series.config.json recurrence grammar drifted from bible-state.json',
        )
    }
    const rules = configBeats.length
    const blackouts = configBlackouts.length
    let next7dOccurrences = 0
    try {
        const occ = expandRecurrenceOccurrencesInHorizon(
            {
                ...(configChrono as Record<string, unknown>),
                scheduled_beats:
                    (configChrono as { scheduled_beats?: unknown[] })
                        .scheduled_beats ?? [],
            } as never,
            7,
        )
        next7dOccurrences = occ.length
    } catch {
        next7dOccurrences = 0
    }
    emitConsole(
        ste,
        `>> [PUBLISH:RECURRENCE] rules=${rules} blackouts=${blackouts} next7dOccurrences=${next7dOccurrences}`,
    )
    return Object.freeze({
        ok: true,
        rules,
        blackouts,
        next7dOccurrences,
    })
}

export interface PublishAutoScriptReadiness {
    ready: boolean
    ruleCount: number
    voiceCount: number
    locationCount: number
    outputSubdir: string
}

export interface CadenceBounds24h {
    ticksPer24h: number
    maxCooldownLimitedScenes: number
    droughtGuaranteedFloorScenes: number
    actCurveSkewRatioPct: number
}

export function estimate24HourCadenceBounds(
    pacingBudget: PacingBudgetConfig,
    tickSeconds: number = 900,
): CadenceBounds24h {
    const safeTick = Math.max(1, Math.trunc(tickSeconds))
    const ticksPer24h = Math.max(1, Math.floor(86400 / safeTick))
    const maxCooldownLimitedScenes =
        Math.floor(
            ticksPer24h /
                Math.max(1, pacingBudget.min_ticks_between_scenes + 1),
        ) + 1
    const droughtGuaranteedFloorScenes = Math.floor(
        ticksPer24h / Math.max(1, pacingBudget.max_dry_spell_ticks + 1),
    )
    const spread =
        pacingBudget.act_iii_multiplier_bps - pacingBudget.act_i_multiplier_bps
    const actCurveSkewRatioPct = Math.trunc(
        (spread * 100) / Math.max(1, pacingBudget.act_i_multiplier_bps),
    )
    return Object.freeze({
        ticksPer24h,
        maxCooldownLimitedScenes,
        droughtGuaranteedFloorScenes,
        actCurveSkewRatioPct,
    })
}

export interface PacingParityInspection {
    ok: boolean
    legacy: boolean
    pacing: PacingBudgetConfig | null
    bounds: CadenceBounds24h | null
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

export function inspectPublishPacingBudgetParity(
    parsedBibleState: any,
    tickSeconds: number = 900,
    ste?: State,
): PacingParityInspection {
    const raw = (parsedBibleState as any)?.auto_script_bundle?.config
        ?.pacing_budget
    if (raw === undefined || raw === null) {
        const fallback = resolvePacingBudgetConfig({})
        const bounds = estimate24HourCadenceBounds(fallback, tickSeconds)
        emitConsole(
            ste,
            ':: [PUBLISH:PACING_WARN] Legacy manifest omits pacing_budget; engine uses canonical defaults',
        )
        return Object.freeze({
            ok: true,
            legacy: true,
            pacing: fallback,
            bounds,
        })
    }
    const parsed = PacingBudgetConfigSchema.safeParse(raw)
    if (!parsed.success) {
        const fallback = resolvePacingBudgetConfig({})
        const bounds = estimate24HourCadenceBounds(fallback, tickSeconds)
        emitConsole(
            ste,
            ':: [PUBLISH:PACING_WARN] Legacy manifest omits pacing_budget; engine uses canonical defaults',
        )
        return Object.freeze({
            ok: true,
            legacy: true,
            pacing: fallback,
            bounds,
        })
    }
    const pacing = parsed.data
    const bounds = estimate24HourCadenceBounds(pacing, tickSeconds)
    emitConsole(
        ste,
        `>> [PUBLISH:PACING] mode=${pacing.act_window_mode} cooldown=${pacing.min_ticks_between_scenes}t dryMax=${pacing.max_dry_spell_ticks}t floor24h=${bounds.droughtGuaranteedFloorScenes}`,
    )
    return Object.freeze({ ok: true, legacy: false, pacing, bounds })
}

export interface ChronoAgendaPublishParity {
    readonly ok: boolean
    readonly empty: boolean
    readonly count: number
    readonly firstIsoDate?: string
    readonly firstStartTimeHm?: string
    readonly firstBeatCategory?: string
}

export function inspectPublishChronoAgendaParity(
    parsedBibleState: unknown,
    ste?: State,
): ChronoAgendaPublishParity {
    const raw = (
        parsedBibleState as { chronology?: { scheduled_beats?: unknown } }
    )?.chronology?.scheduled_beats
    const beats = Array.isArray(raw)
        ? (raw as Array<{
              isoDate?: unknown
              startTimeHm?: unknown
              beatCategory?: unknown
          }>)
        : []
    if (beats.length === 0) {
        emitConsole(
            ste,
            '>> [PUBLISH:AGENDA_EMPTY] No scheduled story appointments configured',
        )
        return Object.freeze({ ok: true, empty: true, count: 0 })
    }
    const first = beats[0]
    const isoDate = String(first.isoDate ?? '')
    const startTimeHm = String(first.startTimeHm ?? '')
    const beatCategory = String(first.beatCategory ?? '')
    emitConsole(
        ste,
        `>> [PUBLISH:AGENDA] count=${beats.length} first=${isoDate} ${startTimeHm} (${beatCategory})`,
    )
    return Object.freeze({
        ok: true,
        empty: false,
        count: beats.length,
        firstIsoDate: isoDate,
        firstStartTimeHm: startTimeHm,
        firstBeatCategory: beatCategory,
    })
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

    try {
        inspectPublishChronoAgendaParity(parsedBibleState, ste)
    } catch {
        // ignore agenda telemetry faults
    }

    try {
        const seriesDirCandidates = [
            dat.seriesDir,
            path.join(repoRoot, 'lore', 'series', seriesSlug),
            path.join(repoRoot, 'series', seriesSlug),
        ].filter(Boolean) as string[]
        for (const candidateDir of seriesDirCandidates) {
            const cfgPath = path.join(candidateDir, 'series.config.json')
            if (fs.existsSync(cfgPath)) {
                try {
                    const liveRaw = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
                    const liveChrono =
                        (liveRaw?.chronology as Record<string, unknown>) ?? {}
                    const sealedChrono =
                        (parsedBibleState?.chronology as Record<
                            string,
                            unknown
                        >) ?? {}
                    const liveBlackouts: string[] = Array.isArray(
                        (
                            liveChrono as {
                                series_blackout_dates?: unknown
                            }
                        ).series_blackout_dates,
                    )
                        ? ([
                              ...(
                                  liveChrono as {
                                      series_blackout_dates: string[]
                                  }
                              ).series_blackout_dates,
                          ].sort() as string[])
                        : []
                    const sealedBlackouts: string[] = Array.isArray(
                        (
                            sealedChrono as {
                                series_blackout_dates?: unknown
                            }
                        ).series_blackout_dates,
                    )
                        ? ([
                              ...(
                                  sealedChrono as {
                                      series_blackout_dates: string[]
                                  }
                              ).series_blackout_dates,
                          ].sort() as string[])
                        : []
                    const liveBeats = canonicalBeatsPublish(
                        (Array.isArray(
                            (
                                liveChrono as {
                                    scheduled_beats?: unknown
                                }
                            ).scheduled_beats,
                        )
                            ? (
                                  liveChrono as {
                                      scheduled_beats: Array<
                                          Record<string, unknown>
                                      >
                                  }
                              ).scheduled_beats
                            : []) as Array<Record<string, unknown>>,
                    )
                    const sealedBeats = canonicalBeatsPublish(
                        (Array.isArray(
                            (
                                sealedChrono as {
                                    scheduled_beats?: unknown
                                }
                            ).scheduled_beats,
                        )
                            ? (
                                  sealedChrono as {
                                      scheduled_beats: Array<
                                          Record<string, unknown>
                                      >
                                  }
                              ).scheduled_beats
                            : []) as Array<Record<string, unknown>>,
                    )
                    if (
                        JSON.stringify(liveBeats) !==
                            JSON.stringify(sealedBeats) ||
                        JSON.stringify(liveBlackouts) !==
                            JSON.stringify(sealedBlackouts)
                    ) {
                        const msg =
                            '[PUBLISH_RECURRENCE_DRIFT] series.config.json recurrence grammar drifted from bible-state.json'
                        emitConsole(
                            ste,
                            ':: [PUBLISH_RECURRENCE_DRIFT] Uncompiled recurrence edits detected; recompile before publish',
                        )
                        if (cpy && typeof cpy === 'object') {
                            cpy.statusMessage = 'FLEET_CANON_PUBLISH_FAILED'
                            cpy.lastError = msg
                        }
                        if (bal?.slv) {
                            bal.slv({
                                pubBit: {
                                    idx: 'publish-fleet-fail',
                                    val: -1,
                                    dat: { error: msg },
                                },
                            })
                        }
                        return cpy
                    }
                    let next7d = 0
                    try {
                        next7d = expandRecurrenceOccurrencesInHorizon(
                            liveChrono as never,
                            7,
                        ).length
                    } catch {
                        next7d = 0
                    }
                    emitConsole(
                        ste,
                        `>> [PUBLISH:RECURRENCE] rules=${liveBeats.length} blackouts=${liveBlackouts.length} next7dOccurrences=${next7d}`,
                    )
                } catch (driftErr: unknown) {
                    const msg =
                        driftErr instanceof Error
                            ? driftErr.message
                            : String(driftErr)
                    if (
                        msg.includes('PUBLISH_RECURRENCE_DRIFT') &&
                        cpy?.statusMessage !== 'FLEET_CANON_PUBLISH_FAILED'
                    ) {
                        emitConsole(ste, `:: ${msg}`)
                        if (cpy && typeof cpy === 'object') {
                            cpy.statusMessage = 'FLEET_CANON_PUBLISH_FAILED'
                            cpy.lastError = msg
                        }
                        if (bal?.slv) {
                            bal.slv({
                                pubBit: {
                                    idx: 'publish-fleet-fail',
                                    val: -1,
                                    dat: { error: msg },
                                },
                            })
                        }
                        return cpy
                    }
                }
                break
            }
        }
    } catch {
        // ignore recurrence parity probe faults when seriesDir absent
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

    try {
        const tickSeconds =
            typeof parsedBibleState?.chronology?.tick_seconds === 'number'
                ? parsedBibleState.chronology.tick_seconds
                : 900
        inspectPublishPacingBudgetParity(parsedBibleState, tickSeconds, ste)
    } catch {
        emitConsole(
            ste,
            ':: [PUBLISH:PACING_WARN] Legacy manifest omits pacing_budget; engine uses canonical defaults',
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
