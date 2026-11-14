import * as fs from 'node:fs'
import * as path from 'node:path'
import type State from '../../99.core/state.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import { resolveRepoRoot } from '../../29.series.unit/buz/scaffoldSeriesTree.buzz.js'
import {
    resolveChronologyConfig,
    DEFAULT_CHRONOLOGY_CONFIG,
    ScheduledBeatSchema,
    RecurrenceRuleSchema,
    isValidGregorianIsoDate,
    sortScheduledBeatsDeterministically,
    type ScheduledBeat,
    type ChronologyConfig,
} from '../../38.types.unit/fce/chronology.interface.js'
import {
    parseCalendarStart,
    advanceGregorianClock,
    expandRecurrenceOccurrencesInHorizon,
    validateChronoAgendaRegistry,
} from '../../05.clock.unit/buz/clock.buzz.js'
import {
    buildChronologyWorldDossier,
    buildChronoAgendaDossier,
    verifyByteZeroBuffer,
} from '../../27.seed.unit/buz/seedWorldDefinitions.buzz.js'

export const CHRONOLOGY_MENU_LABEL = '[T] SIMULATION CHRONOLOGY CLOCK'

export function applySeriesChronologyUpdate(
    seriesDir: string,
    patch: any,
): any {
    const configPath = path.join(seriesDir, 'series.config.json')
    const existing = fs.existsSync(configPath)
        ? JSON.parse(fs.readFileSync(configPath, 'utf8'))
        : {}
    const merged = { ...(existing?.chronology ?? {}), ...(patch ?? {}) }
    const resolved = resolveChronologyConfig(merged)
    parseCalendarStart(resolved)

    existing.chronology = resolved
    if (!existing.series_slug) {
        existing.series_slug = path.basename(seriesDir)
    }
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + '\n', {
        encoding: 'utf8',
    })

    const slug = existing.series_slug || path.basename(seriesDir)
    const worldDir = path.join(seriesDir, 'world')
    if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true })
    }
    const dossier = buildChronologyWorldDossier(resolved, slug)
    const dossierPath = path.join(worldDir, 'chronology.md')
    fs.writeFileSync(dossierPath, dossier.replace(/\r/g, ''), {
        encoding: 'utf8',
    })
    verifyByteZeroBuffer(fs.readFileSync(dossierPath))

    return resolved
}

export function previewChronologyHorizon(cfg: any, ticks: number = 5): any[] {
    const resolved = resolveChronologyConfig(cfg ?? {})
    const snap = parseCalendarStart(resolved)
    const out: any[] = []
    let current = snap
    for (let i = 0; i < ticks; i++) {
        out.push(current)
        current = advanceGregorianClock(current, resolved.tick_seconds)
    }
    return out
}

export const AGENDA_MENU_CHOICE = '[6] SCHEDULED STORY APPOINTMENTS (AGENDA)'

export const AGENDA_SUBMENU_CHOICES: readonly string[] = Object.freeze([
    '[1] LIST SCHEDULED APPOINTMENTS',
    '[2] ADD SCHEDULED STORY BEAT',
    '[3] REMOVE SCHEDULED BEAT BY ID',
    '[4] PREVIEW RESERVE COUNTDOWN TIMELINE',
    '[5] CONFIGURE RECURRENCE & BLACKOUTS',
    '[<] BACK TO CHRONOLOGY MENU',
])

const AGENDA_CATEGORY_CHOICES: readonly string[] = Object.freeze([
    'PARANOIA_TRIGGERED',
    'GRIEVANCE_BREACH',
    'SOMATIC_TRAUMA',
    'INVENTORY_TRANSFER',
    'EPISTEMIC_REVEAL',
    'CHRONO_MILESTONE',
])

function sanitizeAgendaAscii(raw: string): string {
    return String(raw || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
}

function refreshAgendaDossier(
    seriesDir: string,
    slug: string,
    chronology: Record<string, unknown>,
    offsets: Array<{
        beat_id: string
        isoDate: string
        startTimeHm: string
        beatCategory: string
        targetTick: number
        reserveStartTick: number
        reserveCooldownTicks: number
        valid: boolean
    }>,
): void {
    const worldDir = path.join(seriesDir, 'world')
    if (!fs.existsSync(worldDir)) {
        fs.mkdirSync(worldDir, { recursive: true })
    }
    const content = buildChronoAgendaDossier(
        { series_slug: slug },
        chronology,
        offsets,
    ).replace(/\r/g, '')
    const filePath = path.join(worldDir, 'chrono-agenda.md')
    fs.writeFileSync(filePath, content, { encoding: 'utf8' })
    const buf = fs.readFileSync(filePath)
    if (!verifyByteZeroBuffer(buf)) {
        throw new Error(
            `[BYTE_ZERO_BREACH] chrono-agenda.md failed Byte-0 verification at ${filePath}`,
        )
    }
}

function readSeriesConfig(seriesDir: string): Record<string, unknown> {
    const configPath = path.join(seriesDir, 'series.config.json')
    if (!fs.existsSync(configPath)) {
        return {}
    }
    return JSON.parse(fs.readFileSync(configPath, 'utf8')) as Record<
        string,
        unknown
    >
}

function writeSeriesConfig(
    seriesDir: string,
    existing: Record<string, unknown>,
): void {
    const configPath = path.join(seriesDir, 'series.config.json')
    fs.writeFileSync(configPath, JSON.stringify(existing, null, 2) + '\n', {
        encoding: 'utf8',
    })
}

export function upsertScheduledAgendaBeat(
    seriesDir: string,
    beat: unknown,
): ScheduledBeat[] {
    const parsed = ScheduledBeatSchema.parse(beat)
    const existing = readSeriesConfig(seriesDir)
    const baseChronology = (
        typeof (existing as { chronology?: unknown }).chronology === 'object' &&
        (existing as { chronology?: unknown }).chronology !== null
            ? (existing as { chronology?: Record<string, unknown> }).chronology
            : {}
    ) as Record<string, unknown>
    const currentBeats = Array.isArray(
        (baseChronology as { scheduled_beats?: unknown }).scheduled_beats,
    )
        ? [
              ...((baseChronology as { scheduled_beats?: ScheduledBeat[] })
                  .scheduled_beats as ScheduledBeat[]),
          ]
        : []
    const nextBeats = sortScheduledBeatsDeterministically([
        ...currentBeats.filter(
            (b) => (b as ScheduledBeat)?.beat_id !== parsed.beat_id,
        ),
        parsed,
    ])
    const candidate = resolveChronologyConfig({
        ...(baseChronology as Record<string, unknown>),
        scheduled_beats: nextBeats,
    })
    const validation = validateChronoAgendaRegistry(candidate)
    if (!validation.valid) {
        throw new Error(`[AGENDA_IN_THE_PAST] ${validation.errors.join('; ')}`)
    }
    ;(existing as Record<string, unknown>).chronology = candidate
    if (!(existing as Record<string, unknown>).series_slug) {
        ;(existing as Record<string, unknown>).series_slug =
            path.basename(seriesDir)
    }
    writeSeriesConfig(seriesDir, existing)
    refreshAgendaDossier(
        seriesDir,
        String(
            (existing as Record<string, unknown>).series_slug ||
                path.basename(seriesDir),
        ),
        candidate as unknown as Record<string, unknown>,
        validation.resolvedBeats,
    )
    return nextBeats
}

export function removeScheduledAgendaBeat(
    seriesDir: string,
    beatId: string,
): ScheduledBeat[] {
    const id = String(beatId || '').trim()
    if (id.length === 0) {
        throw new Error('[AGENDA_BEAT_NOT_FOUND] beatId cannot be empty.')
    }
    const existing = readSeriesConfig(seriesDir)
    const baseChronology = (
        typeof (existing as { chronology?: unknown }).chronology === 'object' &&
        (existing as { chronology?: unknown }).chronology !== null
            ? (existing as { chronology?: Record<string, unknown> }).chronology
            : {}
    ) as Record<string, unknown>
    const currentBeats = Array.isArray(
        (baseChronology as { scheduled_beats?: unknown }).scheduled_beats,
    )
        ? [
              ...((baseChronology as { scheduled_beats?: ScheduledBeat[] })
                  .scheduled_beats as ScheduledBeat[]),
          ]
        : []
    const filtered = currentBeats.filter(
        (b) => (b as ScheduledBeat)?.beat_id !== id,
    )
    if (filtered.length === currentBeats.length) {
        throw new Error(
            `[AGENDA_BEAT_NOT_FOUND] No scheduled beat with beat_id: ${id}`,
        )
    }
    const nextBeats = sortScheduledBeatsDeterministically(filtered)
    const candidate = resolveChronologyConfig({
        ...(baseChronology as Record<string, unknown>),
        scheduled_beats: nextBeats,
    })
    const validation = validateChronoAgendaRegistry(candidate)
    if (!validation.valid) {
        throw new Error(`[AGENDA_IN_THE_PAST] ${validation.errors.join('; ')}`)
    }
    ;(existing as Record<string, unknown>).chronology = candidate
    if (!(existing as Record<string, unknown>).series_slug) {
        ;(existing as Record<string, unknown>).series_slug =
            path.basename(seriesDir)
    }
    writeSeriesConfig(seriesDir, existing)
    refreshAgendaDossier(
        seriesDir,
        String(
            (existing as Record<string, unknown>).series_slug ||
                path.basename(seriesDir),
        ),
        candidate as unknown as Record<string, unknown>,
        validation.resolvedBeats,
    )
    return nextBeats
}

export function configureBeatRecurrenceRule(
    seriesDir: string,
    beatId: string,
    recurrenceRule: unknown,
): ScheduledBeat[] {
    const parsedRule = RecurrenceRuleSchema.parse(recurrenceRule)
    const id = String(beatId || '').trim()
    if (id.length === 0) {
        throw new Error('[AGENDA_BEAT_NOT_FOUND] beatId cannot be empty.')
    }
    const existing = readSeriesConfig(seriesDir)
    const baseChronology = (
        typeof (existing as { chronology?: unknown }).chronology === 'object' &&
        (existing as { chronology?: unknown }).chronology !== null
            ? (existing as { chronology?: Record<string, unknown> }).chronology
            : {}
    ) as Record<string, unknown>
    const currentBeats = Array.isArray(
        (baseChronology as { scheduled_beats?: unknown }).scheduled_beats,
    )
        ? [
              ...((baseChronology as { scheduled_beats?: ScheduledBeat[] })
                  .scheduled_beats as ScheduledBeat[]),
          ]
        : []
    const target = currentBeats.find(
        (b) => (b as ScheduledBeat)?.beat_id === id,
    )
    if (!target) {
        throw new Error(
            `[AGENDA_BEAT_NOT_FOUND] No scheduled beat with beat_id: ${id}`,
        )
    }
    const merged = ScheduledBeatSchema.parse({
        ...(target as Record<string, unknown>),
        recurrenceRule: parsedRule,
    })
    const nextBeats = sortScheduledBeatsDeterministically([
        ...currentBeats.filter((b) => (b as ScheduledBeat)?.beat_id !== id),
        merged,
    ])
    const candidate = resolveChronologyConfig({
        ...(baseChronology as Record<string, unknown>),
        scheduled_beats: nextBeats,
    })
    const validation = validateChronoAgendaRegistry(candidate)
    if (!validation.valid) {
        throw new Error(`[AGENDA_IN_THE_PAST] ${validation.errors.join('; ')}`)
    }
    ;(existing as Record<string, unknown>).chronology = candidate
    if (!(existing as Record<string, unknown>).series_slug) {
        ;(existing as Record<string, unknown>).series_slug =
            path.basename(seriesDir)
    }
    writeSeriesConfig(seriesDir, existing)
    refreshAgendaDossier(
        seriesDir,
        String(
            (existing as Record<string, unknown>).series_slug ||
                path.basename(seriesDir),
        ),
        candidate as unknown as Record<string, unknown>,
        validation.resolvedBeats,
    )
    return nextBeats
}

export function manageSeriesBlackoutDates(
    seriesDir: string,
    op: 'ADD' | 'REMOVE',
    isoDate: string,
): string[] {
    const date = String(isoDate || '').trim()
    if (!isValidGregorianIsoDate(date)) {
        throw new Error(
            `[INVALID_BLACKOUT_DATE] Invalid blackout date: ${date}`,
        )
    }
    const existing = readSeriesConfig(seriesDir)
    const baseChronology = (
        typeof (existing as { chronology?: unknown }).chronology === 'object' &&
        (existing as { chronology?: unknown }).chronology !== null
            ? (existing as { chronology?: Record<string, unknown> }).chronology
            : {}
    ) as Record<string, unknown>
    const current: string[] = Array.isArray(
        (baseChronology as { series_blackout_dates?: unknown })
            .series_blackout_dates,
    )
        ? [
              ...((baseChronology as { series_blackout_dates?: string[] })
                  .series_blackout_dates as string[]),
          ]
        : []
    let next: string[]
    if (op === 'ADD') {
        next = [...new Set([...current, date])].sort()
    } else {
        next = current.filter((d) => d !== date).sort()
    }
    const candidate = resolveChronologyConfig({
        ...(baseChronology as Record<string, unknown>),
        series_blackout_dates: next,
    })
    const beats = sortScheduledBeatsDeterministically([
        ...(((candidate as { scheduled_beats?: ScheduledBeat[] })
            .scheduled_beats ?? []) as ScheduledBeat[]),
    ])
    const validation = validateChronoAgendaRegistry({
        ...(candidate as Record<string, unknown>),
        scheduled_beats: beats,
    } as unknown as ChronologyConfig)
    if (!validation.valid) {
        throw new Error(`[AGENDA_IN_THE_PAST] ${validation.errors.join('; ')}`)
    }
    ;(existing as Record<string, unknown>).chronology = {
        ...(candidate as Record<string, unknown>),
        scheduled_beats: beats,
    }
    if (!(existing as Record<string, unknown>).series_slug) {
        ;(existing as Record<string, unknown>).series_slug =
            path.basename(seriesDir)
    }
    writeSeriesConfig(seriesDir, existing)
    refreshAgendaDossier(
        seriesDir,
        String(
            (existing as Record<string, unknown>).series_slug ||
                path.basename(seriesDir),
        ),
        candidate as unknown as Record<string, unknown>,
        validation.resolvedBeats,
    )
    return next
}

export function previewRecurrenceCalendarHorizon(
    chronology: unknown,
    horizonDays = 14,
    ste?: State,
): string[] {
    const cfg = resolveChronologyConfig(
        ((chronology as Record<string, unknown>) ?? {}) as never,
    )
    const horizon = Math.trunc(Number(horizonDays)) || 14
    const occurrences = expandRecurrenceOccurrencesInHorizon(cfg, horizon)
    const lines: string[] = []
    if (occurrences.length === 0) {
        const empty =
            '>> [RECURRENCE:PREVIEW] No recurring occurrences in horizon'
        lines.push(empty)
        emitConsole(ste, empty)
        return lines
    }
    for (const o of occurrences) {
        const shifted = o.shifted ? ` | SHIFTED_FROM:${o.shiftedFrom}` : ''
        const line = sanitizeAgendaAscii(
            `>> [RECURRENCE:PREVIEW] ${o.isoDate} (${o.weekday}) ${o.startTimeHm} | T+${o.targetTick} | ${o.lunarPhase} | ${o.beat_id}${shifted}`,
        )
        lines.push(line)
        emitConsole(ste, line)
    }
    return lines
}

export const RECURRENCE_SUBMENU_CHOICES: readonly string[] = Object.freeze([
    '[1] ASSIGN BEAT RECURRENCE RULE (WEEKDAY / INTERVAL / LUNAR / SOLAR)',
    '[2] ADD SERIES HOLIDAY BLACKOUT DATE',
    '[3] REMOVE SERIES HOLIDAY BLACKOUT DATE',
    '[4] PREVIEW 14-DAY RECURRENCE & LUNAR CALENDAR',
    '[<] BACK TO CHRONOLOGY MENU',
])

export const RECURRENCE_MENU_CHOICE = '[7] CALENDAR RECURRENCE & BLACKOUT RULES'

export async function runRecurrenceGrammarSubmenu(
    seriesDir: string,
    chronology: unknown,
    lib: unknown,
    net: unknown,
    ste?: State,
): Promise<void> {
    const typedLib = lib as {
        hunt: (
            action: string,
            payload: Record<string, unknown>,
        ) => Promise<unknown>
    }
    let activeChrono = chronology
    while (true) {
        try {
            const current = readSeriesConfig(seriesDir)
            if (
                current &&
                typeof current === 'object' &&
                (current as { chronology?: unknown }).chronology
            ) {
                activeChrono = (current as { chronology?: unknown }).chronology
            }
        } catch {
            // keep in-memory chronology on read faults
        }
        previewRecurrenceCalendarHorizon(activeChrono, 14, ste)
        const resolvedNet =
            (net as { grdBit?: { dat?: unknown } })?.grdBit?.dat ?? net
        let choiceRes: unknown = null
        try {
            choiceRes = await typedLib.hunt('[Open action] Open Choice', {
                dat: { clr0: 0, clr1: 3 },
                src: 'VERTICAL',
                lst: [...RECURRENCE_SUBMENU_CHOICES],
                net: resolvedNet,
            })
        } catch (err: unknown) {
            emitConsole(
                ste,
                `:: [RECURRENCE:ERR] ${(err as Error)?.message || String(err)}`,
            )
            return
        }
        void activeChrono
        const picked = String(
            (choiceRes as { chcBit?: { src?: unknown } })?.chcBit?.src || '',
        )
        if (!picked || picked === RECURRENCE_SUBMENU_CHOICES[4]) {
            return
        }
        try {
            if (picked === RECURRENCE_SUBMENU_CHOICES[0]) {
                const beatId = await promptAgendaInput(
                    typedLib,
                    net,
                    'BEAT_ID:',
                    '',
                )
                if (beatId === null) {
                    emitConsole(ste, ':: [RECURRENCE:CANCEL] Assign cancelled.')
                    continue
                }
                const freqRes = (await typedLib.hunt(
                    '[Open action] Open Choice',
                    {
                        dat: { clr0: 0, clr1: 3 },
                        src: 'VERTICAL',
                        lst: [
                            'ONCE',
                            'DAILY',
                            'WEEKLY_MASK',
                            'INTERVAL_DAYS',
                            'LUNAR_PHASE',
                            'SOLAR_SOLSTICE_EQUINOX',
                        ],
                        net: resolvedNet,
                    },
                )) as { chcBit?: { src?: unknown } }
                const frequency = String(freqRes?.chcBit?.src || 'DAILY')
                const rule: Record<string, unknown> = { frequency }
                if (frequency === 'WEEKLY_MASK') {
                    const maskRaw = await promptAgendaInput(
                        typedLib,
                        net,
                        'WEEKDAY MASK (comma MON..SUN):',
                        'FRI',
                    )
                    if (maskRaw === null) continue
                    rule['weekdayMask'] = String(maskRaw)
                        .split(',')
                        .map((s) => s.trim().toUpperCase())
                        .filter(Boolean)
                }
                if (frequency === 'INTERVAL_DAYS') {
                    const raw = await promptAgendaInput(
                        typedLib,
                        net,
                        'INTERVAL DAYS (1-365):',
                        '7',
                    )
                    if (raw === null) continue
                    rule['intervalDays'] = Number(raw)
                }
                if (frequency === 'LUNAR_PHASE') {
                    const lunarRes = (await typedLib.hunt(
                        '[Open action] Open Choice',
                        {
                            dat: { clr0: 0, clr1: 3 },
                            src: 'VERTICAL',
                            lst: [
                                'NEW_MOON',
                                'FIRST_QUARTER',
                                'FULL_MOON',
                                'LAST_QUARTER',
                            ],
                            net: resolvedNet,
                        },
                    )) as { chcBit?: { src?: unknown } }
                    rule['lunarPhase'] = String(
                        lunarRes?.chcBit?.src || 'FULL_MOON',
                    )
                }
                if (frequency === 'SOLAR_SOLSTICE_EQUINOX') {
                    const solarRes = (await typedLib.hunt(
                        '[Open action] Open Choice',
                        {
                            dat: { clr0: 0, clr1: 3 },
                            src: 'VERTICAL',
                            lst: [
                                'VERNAL_EQUINOX',
                                'SUMMER_SOLSTICE',
                                'AUTUMN_EQUINOX',
                                'WINTER_SOLSTICE',
                            ],
                            net: resolvedNet,
                        },
                    )) as { chcBit?: { src?: unknown } }
                    rule['solarMarkers'] = [
                        String(solarRes?.chcBit?.src || 'WINTER_SOLSTICE'),
                    ]
                }
                const policyRes = (await typedLib.hunt(
                    '[Open action] Open Choice',
                    {
                        dat: { clr0: 0, clr1: 3 },
                        src: 'VERTICAL',
                        lst: ['SKIP', 'DEFER_NEXT_VALID_DAY'],
                        net: resolvedNet,
                    },
                )) as { chcBit?: { src?: unknown } }
                rule['blackoutShiftPolicy'] = String(
                    policyRes?.chcBit?.src || 'SKIP',
                )
                const saved = configureBeatRecurrenceRule(
                    seriesDir,
                    beatId,
                    rule,
                )
                emitConsole(
                    ste,
                    sanitizeAgendaAscii(
                        `>> [RECURRENCE:SAVED] ${beatId} ${frequency} count=${saved.length}`,
                    ),
                )
            } else if (picked === RECURRENCE_SUBMENU_CHOICES[1]) {
                const isoDate = await promptAgendaInput(
                    typedLib,
                    net,
                    'BLACKOUT ISO DATE (YYYY-MM-DD):',
                    '2026-12-25',
                )
                if (isoDate === null) continue
                const next = manageSeriesBlackoutDates(
                    seriesDir,
                    'ADD',
                    isoDate,
                )
                emitConsole(
                    ste,
                    sanitizeAgendaAscii(
                        `>> [RECURRENCE:BLACKOUT_ADDED] ${isoDate} total=${next.length}`,
                    ),
                )
            } else if (picked === RECURRENCE_SUBMENU_CHOICES[2]) {
                const isoDate = await promptAgendaInput(
                    typedLib,
                    net,
                    'BLACKOUT ISO DATE TO REMOVE:',
                    '',
                )
                if (isoDate === null) continue
                const next = manageSeriesBlackoutDates(
                    seriesDir,
                    'REMOVE',
                    isoDate,
                )
                emitConsole(
                    ste,
                    sanitizeAgendaAscii(
                        `>> [RECURRENCE:BLACKOUT_REMOVED] ${isoDate} total=${next.length}`,
                    ),
                )
            } else if (picked === RECURRENCE_SUBMENU_CHOICES[3]) {
                const current = readSeriesConfig(seriesDir)
                previewRecurrenceCalendarHorizon(
                    (current as { chronology?: unknown }).chronology ??
                        activeChrono,
                    14,
                    ste,
                )
            }
        } catch (err: unknown) {
            emitConsole(
                ste,
                sanitizeAgendaAscii(
                    `:: [RECURRENCE:ERR] ${(err as Error)?.message || String(err)}`,
                ),
            )
        }
    }
}

export function previewChronoAgendaTimeline(
    chronology: unknown,
    ste?: State,
): string[] {
    const cfg = resolveChronologyConfig(
        ((chronology as Record<string, unknown>) ?? {}) as never,
    )
    const beats = sortScheduledBeatsDeterministically([
        ...(((cfg as unknown as { scheduled_beats?: ScheduledBeat[] })
            .scheduled_beats ?? []) as ScheduledBeat[]),
    ])
    const lines: string[] = []
    if (beats.length === 0) {
        const empty =
            '>> [AGENDA:EMPTY] No scheduled story appointments configured'
        lines.push(empty)
        emitConsole(ste, empty)
        return lines
    }
    const validation = validateChronoAgendaRegistry(cfg)
    const offsetById = new Map(
        validation.resolvedBeats.map((o) => [o.beat_id, o]),
    )
    beats.forEach((b, i) => {
        const o = offsetById.get(b.beat_id)
        const tickLabel =
            o && o.valid
                ? `T+${o.targetTick} (RES:${o.reserveStartTick}..${o.targetTick})`
                : 'T+PAST (RES:0..0)'
        const line = sanitizeAgendaAscii(
            `>> [AGENDA:BEAT] #${i + 1} | ${b.isoDate} ${b.startTimeHm} | ${tickLabel} | ${String(b.beatCategory)} | ${b.title}`,
        )
        lines.push(line)
        emitConsole(ste, line)
    })
    for (const ov of validation.overlaps) {
        const warn = sanitizeAgendaAscii(
            `:: [AGENDA:OVERLAP] ${ov.prevBeatId} T+${ov.prevTargetTick} overlaps ${ov.nextBeatId} RES:${ov.nextReserveStartTick}`,
        )
        lines.push(warn)
        emitConsole(ste, warn)
    }
    for (const err of validation.errors) {
        const past = sanitizeAgendaAscii(`:: [AGENDA:PAST] ${err}`)
        lines.push(past)
        emitConsole(ste, past)
    }
    return lines
}

async function promptAgendaInput(
    lib: any,
    net: any,
    txt: string,
    initialValue: string,
): Promise<string | null> {
    const inputRes = await lib.hunt('[Open action] Open Input', {
        txt,
        src: initialValue,
        dat: { clr0: 0, clr1: 3 },
        net,
    })
    const rawStr = String(
        inputRes?.putBit?.src ?? inputRes?.inpBit?.src ?? '',
    ).trim()
    if (inputRes?.putBit?.val === -1 || rawStr.length === 0) {
        return null
    }
    return rawStr
}

export async function runChronoAgendaSubmenu(
    seriesDir: string,
    chronology: unknown,
    lib: any,
    net: any,
    ste?: State,
): Promise<void> {
    let activeChrono = chronology
    while (true) {
        try {
            const current = readSeriesConfig(seriesDir)
            if (
                current &&
                typeof current === 'object' &&
                (current as { chronology?: unknown }).chronology
            ) {
                activeChrono = (current as { chronology?: unknown }).chronology
            }
        } catch {
            // Keep provided chronology if series.config.json is absent in headless tests
        }
        previewChronoAgendaTimeline(activeChrono, ste)
        let choiceRes: any = null
        try {
            choiceRes = await lib.hunt('[Open action] Open Choice', {
                dat: { clr0: 0, clr1: 3 },
                src: 'VERTICAL',
                lst: [...AGENDA_SUBMENU_CHOICES],
                net,
            })
        } catch (err: any) {
            emitConsole(ste, `:: [AGENDA:ERR] ${err?.message || String(err)}`)
            return
        }
        const picked = String(choiceRes?.chcBit?.src || '')
        if (!picked || picked === AGENDA_SUBMENU_CHOICES[5]) {
            return
        }
        try {
            if (picked === AGENDA_SUBMENU_CHOICES[0]) {
                const current = readSeriesConfig(seriesDir)
                previewChronoAgendaTimeline(
                    (current as { chronology?: unknown }).chronology ??
                        activeChrono,
                    ste,
                )
            } else if (picked === AGENDA_SUBMENU_CHOICES[1]) {
                const beatId = await promptAgendaInput(
                    lib,
                    net,
                    'BEAT_ID (a-z0-9_):',
                    'curfew_one',
                )
                if (beatId === null) {
                    emitConsole(ste, ':: [AGENDA:CANCEL] Add beat cancelled.')
                    continue
                }
                const title =
                    (await promptAgendaInput(
                        lib,
                        net,
                        'TITLE:',
                        'Midnight Curfew',
                    )) ?? 'Scheduled Beat'
                const isoDate = await promptAgendaInput(
                    lib,
                    net,
                    'ISO DATE (YYYY-MM-DD):',
                    String(
                        (activeChrono as { start_date?: string })?.start_date ||
                            '2026-10-31',
                    ),
                )
                if (isoDate === null) {
                    emitConsole(ste, ':: [AGENDA:CANCEL] Add beat cancelled.')
                    continue
                }
                const startTimeHm = await promptAgendaInput(
                    lib,
                    net,
                    'START TIME (HH:MM):',
                    '23:30',
                )
                if (startTimeHm === null) {
                    emitConsole(ste, ':: [AGENDA:CANCEL] Add beat cancelled.')
                    continue
                }
                const catRes = await lib.hunt('[Open action] Open Choice', {
                    dat: { clr0: 0, clr1: 3 },
                    src: 'VERTICAL',
                    lst: [...AGENDA_CATEGORY_CHOICES],
                    net,
                })
                const beatCategory = String(
                    catRes?.chcBit?.src || 'GRIEVANCE_BREACH',
                )
                const reserveRaw =
                    (await promptAgendaInput(
                        lib,
                        net,
                        'RESERVE COOLDOWN TICKS (0-1000):',
                        '2',
                    )) ?? '2'
                const saved = upsertScheduledAgendaBeat(seriesDir, {
                    beat_id: beatId,
                    title,
                    isoDate,
                    startTimeHm,
                    beatCategory,
                    reserveCooldownTicks: Number(reserveRaw),
                })
                const added = saved.find((b) => b.beat_id === beatId)
                emitConsole(
                    ste,
                    sanitizeAgendaAscii(
                        `>> [AGENDA:SAVED] ${beatId} ${isoDate} ${startTimeHm} (${beatCategory}) count=${saved.length} reserve=${added?.reserveCooldownTicks ?? 2}`,
                    ),
                )
            } else if (picked === AGENDA_SUBMENU_CHOICES[2]) {
                const beatId = await promptAgendaInput(
                    lib,
                    net,
                    'BEAT_ID TO REMOVE:',
                    '',
                )
                if (beatId === null) {
                    emitConsole(
                        ste,
                        ':: [AGENDA:CANCEL] Remove beat cancelled.',
                    )
                    continue
                }
                const remaining = removeScheduledAgendaBeat(seriesDir, beatId)
                emitConsole(
                    ste,
                    sanitizeAgendaAscii(
                        `>> [AGENDA:REMOVED] ${beatId} remaining=${remaining.length}`,
                    ),
                )
            } else if (picked === AGENDA_SUBMENU_CHOICES[3]) {
                const current = readSeriesConfig(seriesDir)
                previewChronoAgendaTimeline(
                    (current as { chronology?: unknown }).chronology ??
                        activeChrono,
                    ste,
                )
            } else if (picked === AGENDA_SUBMENU_CHOICES[4]) {
                const current = readSeriesConfig(seriesDir)
                await runRecurrenceGrammarSubmenu(
                    seriesDir,
                    (current as { chronology?: unknown }).chronology ??
                        activeChrono,
                    lib,
                    net,
                    ste,
                )
            }
        } catch (err: any) {
            emitConsole(
                ste,
                sanitizeAgendaAscii(
                    `:: [AGENDA:ERR] ${err?.message || String(err)}`,
                ),
            )
        }
    }
}

function emitConsole(ste: State | undefined, line: string): void {
    const clean = String(line || '')
        .replace(/[^\x20-\x7E]/g, '')
        .trim()
    const lib = (globalThis as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        try {
            lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: clean,
            })
        } catch {}
        return
    }
    if (ste && typeof ste.hunt === 'function') {
        try {
            ste.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: clean,
            })
        } catch {}
    }
}

export const runChronologyMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste?: State,
): Promise<MenuModel> => {
    const dat = (bal?.dat || {}) as Record<string, any>
    const lib = (globalThis as any).LIBRARY

    // Headless programmatic update
    if (dat.patch && dat.seriesDir) {
        try {
            const resolved = applySeriesChronologyUpdate(
                dat.seriesDir,
                dat.patch,
            )
            emitConsole(
                ste,
                `>> [CHRONO:OK] Updated ${resolved.start_date} ${resolved.start_time}`,
            )
            if (bal?.slv) {
                bal.slv({
                    mnuBit: {
                        idx: bal.idx || 'chronology-menu',
                        val: 1,
                        dat: { chronology: resolved },
                    },
                })
            }
            return cpy
        } catch (err: any) {
            emitConsole(ste, `:: [CHRONO:ERR] ${err?.message || String(err)}`)
            if (bal?.slv) {
                bal.slv({
                    mnuBit: {
                        idx: bal.idx || 'chronology-menu',
                        val: -1,
                        dat: { error: err?.message || String(err) },
                    },
                })
            }
            return cpy
        }
    }

    // Preview
    if (dat.preview) {
        const cfg = dat.chronology || DEFAULT_CHRONOLOGY_CONFIG
        const horizon = previewChronologyHorizon(cfg, dat.ticks || 5)
        emitConsole(ste, `>> [CHRONO:PREVIEW] ${horizon.length} ticks`)
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: bal.idx || 'chronology-menu',
                    val: 1,
                    dat: { horizon },
                },
            })
        }
        return cpy
    }

    // Headless Chrono Agenda management (non-blocking, no Blessed I/O)
    if (
        (dat as any).action === 'MANAGE_CHRONO_AGENDA' ||
        (dat as any).agendaBeat ||
        (dat as any).removeBeatId ||
        (dat as any).previewAgenda
    ) {
        try {
            if ((dat as any).agendaBeat && (dat as any).seriesDir) {
                const beats = upsertScheduledAgendaBeat(
                    (dat as any).seriesDir,
                    (dat as any).agendaBeat,
                )
                emitConsole(
                    ste,
                    '>> [AGENDA:SAVED] count=' +
                        beats.length +
                        ' series=' +
                        path.basename((dat as any).seriesDir),
                )
                if (bal?.slv) {
                    bal.slv({
                        mnuBit: {
                            idx: bal.idx || 'chronology-menu',
                            val: 1,
                            dat: { beats },
                        },
                    })
                }
                return cpy
            }
            if ((dat as any).removeBeatId && (dat as any).seriesDir) {
                const beats = removeScheduledAgendaBeat(
                    (dat as any).seriesDir,
                    (dat as any).removeBeatId,
                )
                emitConsole(
                    ste,
                    '>> [AGENDA:REMOVED] ' +
                        (dat as any).removeBeatId +
                        ' remaining=' +
                        beats.length,
                )
                if (bal?.slv) {
                    bal.slv({
                        mnuBit: {
                            idx: bal.idx || 'chronology-menu',
                            val: 1,
                            dat: { beats },
                        },
                    })
                }
                return cpy
            }
            if ((dat as any).previewAgenda) {
                let previewChronology = (dat as any).chronology
                if (!previewChronology && (dat as any).seriesDir) {
                    try {
                        const cfg = JSON.parse(
                            fs.readFileSync(
                                path.join(
                                    (dat as any).seriesDir,
                                    'series.config.json',
                                ),
                                'utf8',
                            ),
                        )
                        previewChronology = cfg?.chronology
                    } catch {
                        previewChronology = DEFAULT_CHRONOLOGY_CONFIG
                    }
                }
                const lines = previewChronoAgendaTimeline(
                    previewChronology,
                    ste,
                )
                if (bal?.slv) {
                    bal.slv({
                        mnuBit: {
                            idx: bal.idx || 'chronology-menu',
                            val: 1,
                            dat: { preview: lines },
                        },
                    })
                }
                return cpy
            }
        } catch (err: any) {
            emitConsole(ste, ':: [AGENDA:ERR] ' + (err?.message || String(err)))
            if (bal?.slv) {
                bal.slv({
                    mnuBit: {
                        idx: bal.idx || 'chronology-menu',
                        val: -1,
                        dat: { error: err?.message || String(err) },
                    },
                })
            }
            return cpy
        }
    }

    // Inspect active series
    const repoRoot = dat.repoRoot || resolveRepoRoot()
    const seriesSlug =
        dat.activeSeries || cpy?.activeSeries || '000.sample-hearth'
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)
    let chronology = DEFAULT_CHRONOLOGY_CONFIG
    const configPath = path.join(seriesDir, 'series.config.json')
    if (fs.existsSync(configPath)) {
        try {
            const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'))
            chronology = resolveChronologyConfig(cfg?.chronology)
        } catch {
            chronology = DEFAULT_CHRONOLOGY_CONFIG
        }
    }
    const snap = parseCalendarStart(chronology)
    emitConsole(
        ste,
        `>> [CHRONO:INSPECT] ${chronology.start_date} ${chronology.start_time} ${snap.daypart} ${chronology.tick_seconds}s`,
    )

    const choices = [
        '[1] INSPECT SERIES CHRONOLOGY',
        '[2] SET START DATE (YYYY-MM-DD)',
        '[3] SET START TIME (HH:MM:SS)',
        '[4] SET TICK CADENCE (SECONDS)',
        '[5] PREVIEW +5 TICK HORIZON',
        AGENDA_MENU_CHOICE,
        RECURRENCE_MENU_CHOICE,
        '[<] RETURN TO LORE MENU',
    ]

    if (lib && typeof lib.hunt === 'function') {
        try {
            const grid = await lib.hunt('[Grid action] Update Grid', {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: 8,
            })
            const net = grid?.grdBit?.dat
            const choiceRes = await lib.hunt('[Open action] Open Choice', {
                lst: choices,
                net,
            })
            const pickedAgenda = String((choiceRes as any)?.chcBit?.src || '')
            if (pickedAgenda === AGENDA_MENU_CHOICE) {
                await runChronoAgendaSubmenu(
                    seriesDir,
                    chronology,
                    lib,
                    net,
                    ste,
                )
                try {
                    const refreshed = JSON.parse(
                        fs.readFileSync(configPath, 'utf8'),
                    )
                    chronology = resolveChronologyConfig(refreshed?.chronology)
                } catch {
                    // keep in-memory chronology on refresh failure
                }
            } else if (pickedAgenda === RECURRENCE_MENU_CHOICE) {
                await runRecurrenceGrammarSubmenu(
                    seriesDir,
                    chronology,
                    lib,
                    net,
                    ste,
                )
                try {
                    const refreshed = JSON.parse(
                        fs.readFileSync(configPath, 'utf8'),
                    )
                    chronology = resolveChronologyConfig(refreshed?.chronology)
                } catch {
                    // keep in-memory chronology on refresh failure
                }
            }
        } catch {}
    }

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: bal.idx || 'chronology-menu',
                val: 1,
                lst: choices,
                dat: { chronology, snapshot: snap },
            },
        })
    }
    return cpy
}
