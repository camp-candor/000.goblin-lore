import { ClockModel } from '../clock.model.js'
import type ClockBit from '../fce/clock.bit.js'
import type State from '../../99.core/state.js'
import {
    isValidGregorianIsoDate,
    normalizeBeatRecurrenceRule,
    resolveChronologyConfig,
    sortScheduledBeatsDeterministically,
    type ChronologyConfig,
    type CalendarClockSnapshot,
    type DaypartBand,
    type ScheduledBeat,
    type AgendaBeatTickOffset,
    type AgendaReserveOverlap,
    type ChronoAgendaValidation,
    type LunarPhaseToken,
    type RecurrenceRule,
    type SolarMarkerToken,
    type WeekdayToken,
    normalizeClockTimeHms,
    DEFAULT_CHRONOLOGY_CONFIG,
} from '../../38.types.unit/fce/chronology.interface.js'
import type {
    ExpandedBeatOccurrence,
    LunarPhaseSnapshot,
    RecurrenceHorizonProjection,
} from '../fce/clock.interface.js'

export type {
    ExpandedBeatOccurrence,
    LunarPhaseSnapshot,
    RecurrenceHorizonProjection,
} from '../fce/clock.interface.js'

export {
    resolveChronologyConfig,
    normalizeClockTimeHms,
    DEFAULT_CHRONOLOGY_CONFIG,
} from '../../38.types.unit/fce/chronology.interface.js'
export type {
    ChronologyConfig,
    CalendarClockSnapshot,
    DaypartBand,
} from '../../38.types.unit/fce/chronology.interface.js'
export type {
    ScheduledBeat,
    ChronoAgendaRegistry,
    AgendaBeatTickOffset,
    AgendaReserveOverlap,
    ChronoAgendaValidation,
} from '../../38.types.unit/fce/chronology.interface.js'

// Pure helpers

export const isGregorianLeapYear = (year: number): boolean => {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}

export const daysInGregorianMonth = (year: number, month: number): number => {
    if (month === 2) return isGregorianLeapYear(year) ? 29 : 28
    if ([4, 6, 9, 11].includes(month)) return 30
    return 31
}

export const deriveDaypart = (hour: number): DaypartBand => {
    if (hour >= 5 && hour <= 6) return 'DAWN'
    if (hour >= 7 && hour <= 11) return 'MORNING'
    if (hour >= 12 && hour <= 16) return 'AFTERNOON'
    if (hour >= 17 && hour <= 19) return 'DUSK'
    return 'NIGHT'
}

function pad2(n: number): string {
    return String(n).padStart(2, '0')
}

function daysFromCivil(y: number, m: number, d: number): number {
    const y2 = m <= 2 ? y - 1 : y
    const era = ((y2 >= 0 ? y2 : y2 - 399) / 400) | 0
    const yoe = y2 - era * 400
    const doy = Math.floor((153 * (m > 2 ? m - 3 : m + 9) + 2) / 5) + d - 1
    const doe = yoe * 365 + Math.floor(yoe / 4) - Math.floor(yoe / 100) + doy
    return era * 146097 + doe - 719468
}

function civilFromDays(z: number): { y: number; m: number; d: number } {
    const Z = z + 719468
    const era = ((Z >= 0 ? Z : Z - 146096) / 146097) | 0
    const doe = Z - era * 146097
    const yoe = Math.floor(
        (doe -
            Math.floor(doe / 1460) +
            Math.floor(doe / 36524) -
            Math.floor(doe / 146096)) /
            365,
    )
    const y = yoe + era * 400
    const doy = doe - (365 * yoe + Math.floor(yoe / 4) - Math.floor(yoe / 100))
    const mp = Math.floor((5 * doy + 2) / 153)
    const d = doy - Math.floor((153 * mp + 2) / 5) + 1
    const m = mp < 10 ? mp + 3 : mp - 9
    return { y: m <= 2 ? y + 1 : y, m, d }
}

export const formatSmpteTimecode = (
    totalSeconds: number,
    centisecond: number,
    fps: number = 24,
): string => {
    const sec = ((totalSeconds % 86400) + 86400) % 86400
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    const frames = Math.floor((centisecond * fps) / 100) % fps
    return `${pad2(h)}:${pad2(m)}:${pad2(s)}:${pad2(frames)}`
}

export const formatClockTimecode = formatSmpteTimecode

export const parseCalendarStart = (
    cfg: ChronologyConfig,
): CalendarClockSnapshot => {
    const [yStr, mStr, dStr] = String(cfg.start_date).split('-')
    const year = Number(yStr)
    const month = Number(mStr)
    const day = Number(dStr)
    if (month < 1 || month > 12) {
        throw new Error(`INVALID_CALENDAR_DATE:${cfg.start_date}`)
    }
    if (day < 1 || day > daysInGregorianMonth(year, month)) {
        throw new Error(`INVALID_CALENDAR_DATE:${cfg.start_date}`)
    }
    const hms = normalizeClockTimeHms(cfg.start_time)
    const parts = hms.split(':').map(Number)
    const hour = parts[0]
    const minute = parts[1]
    const second = parts[2] ?? 0
    if (hour > 23 || minute > 59 || second > 59) {
        throw new Error(`INVALID_CALENDAR_DATE:${cfg.start_date}`)
    }
    const fps = cfg.frames_per_second
    const snap: CalendarClockSnapshot = {
        year,
        month,
        day,
        hour,
        minute,
        second,
        centisecond: 0,
        tickCount: 0,
        tickSeconds: cfg.tick_seconds,
        framesPerSecond: fps,
        totalElapsedSeconds: 0,
        totalFrames: 0,
        isoDate: `${String(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}`,
        clockTimeHm: `${pad2(hour)}:${pad2(minute)}`,
        clockTimeHms: `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`,
        timecodeSmpte: formatSmpteTimecode(
            hour * 3600 + minute * 60 + second,
            0,
            fps,
        ),
        daypart: deriveDaypart(hour),
        timezoneLabel: cfg.timezone_label,
        eraLabel: cfg.era_label,
    }
    return snap
}

export const advanceGregorianClock = (
    snapshot: CalendarClockSnapshot,
    deltaSeconds: number,
    deltaCentiseconds: number = 0,
): CalendarClockSnapshot => {
    const totalCs =
        snapshot.centisecond + deltaCentiseconds + deltaSeconds * 100
    const carrySeconds = Math.floor(totalCs / 100)
    const newCentisecond = ((totalCs % 100) + 100) % 100

    const totalSec =
        snapshot.hour * 3600 +
        snapshot.minute * 60 +
        snapshot.second +
        carrySeconds
    const extraDays = Math.floor(totalSec / 86400)
    const remSec = ((totalSec % 86400) + 86400) % 86400
    const hour = Math.floor(remSec / 3600)
    const minute = Math.floor((remSec % 3600) / 60)
    const second = remSec % 60

    const days =
        daysFromCivil(snapshot.year, snapshot.month, snapshot.day) + extraDays
    const c = civilFromDays(days)

    const fps = snapshot.framesPerSecond
    const totalElapsedSeconds = snapshot.totalElapsedSeconds + deltaSeconds
    const snap: CalendarClockSnapshot = {
        year: c.y,
        month: c.m,
        day: c.d,
        hour,
        minute,
        second,
        centisecond: newCentisecond,
        tickCount: snapshot.tickCount,
        tickSeconds: snapshot.tickSeconds,
        framesPerSecond: fps,
        totalElapsedSeconds,
        totalFrames: totalElapsedSeconds * fps,
        isoDate: `${String(c.y).padStart(4, '0')}-${pad2(c.m)}-${pad2(c.d)}`,
        clockTimeHm: `${pad2(hour)}:${pad2(minute)}`,
        clockTimeHms: `${pad2(hour)}:${pad2(minute)}:${pad2(second)}`,
        timecodeSmpte: formatSmpteTimecode(
            hour * 3600 + minute * 60 + second,
            newCentisecond,
            fps,
        ),
        daypart: deriveDaypart(hour),
        timezoneLabel: snapshot.timezoneLabel,
        eraLabel: snapshot.eraLabel,
    }
    return snap
}

export const computeGregorianEpochSeconds = (
    isoDate: string,
    hmsTime: string,
): number => {
    const dateParts = String(isoDate).split('-').map(Number)
    const hms = normalizeClockTimeHms(hmsTime)
    const timeParts = hms.split(':').map(Number)
    const year = dateParts[0]
    const month = dateParts[1]
    const day = dateParts[2]
    const hour = timeParts[0]
    const minute = timeParts[1]
    const second = timeParts[2] ?? 0
    return Math.trunc(
        Date.UTC(year, month - 1, day, hour, minute, second) / 1000,
    )
}

export const computeAgendaBeatTickOffset = (
    chronology: ChronologyConfig,
    beat: ScheduledBeat,
): AgendaBeatTickOffset => {
    const originEpoch = computeGregorianEpochSeconds(
        chronology.start_date,
        normalizeClockTimeHms(chronology.start_time),
    )
    const targetEpoch = computeGregorianEpochSeconds(
        beat.isoDate,
        normalizeClockTimeHms(beat.startTimeHm),
    )
    const deltaSeconds = targetEpoch - originEpoch
    const recurring = beat.recurringDaily === true
    if (!recurring && deltaSeconds < 0) {
        return Object.freeze({
            beat_id: beat.beat_id,
            isoDate: beat.isoDate,
            startTimeHm: beat.startTimeHm,
            beatCategory: String(beat.beatCategory),
            deltaSeconds,
            targetTick: -1,
            reserveStartTick: 0,
            reserveCooldownTicks: beat.reserveCooldownTicks,
            valid: false,
            errorCode: 'AGENDA_IN_THE_PAST',
        })
    }
    const tickSeconds = Math.max(1, Math.trunc(chronology.tick_seconds))
    const targetTick = Math.ceil(Math.max(0, deltaSeconds) / tickSeconds)
    const reserveStartTick = Math.max(
        0,
        targetTick - Math.trunc(beat.reserveCooldownTicks),
    )
    return Object.freeze({
        beat_id: beat.beat_id,
        isoDate: beat.isoDate,
        startTimeHm: beat.startTimeHm,
        beatCategory: String(beat.beatCategory),
        deltaSeconds,
        targetTick,
        reserveStartTick,
        reserveCooldownTicks: Math.trunc(beat.reserveCooldownTicks),
        valid: true,
    })
}

export const validateChronoAgendaRegistry = (
    chronology: ChronologyConfig,
): ChronoAgendaValidation => {
    const beats = sortScheduledBeatsDeterministically([
        ...(chronology.scheduled_beats ?? []),
    ])
    const errors: string[] = []
    const resolved: AgendaBeatTickOffset[] = []
    for (const beat of beats) {
        const offset = computeAgendaBeatTickOffset(chronology, beat)
        resolved.push(offset)
        if (!offset.valid) {
            errors.push(
                '[AGENDA_IN_THE_PAST] Beat ' +
                    offset.beat_id +
                    ' scheduled before origin',
            )
        }
    }
    resolved.sort((a, b) => {
        if (a.targetTick !== b.targetTick) return a.targetTick - b.targetTick
        if (a.isoDate < b.isoDate) return -1
        if (a.isoDate > b.isoDate) return 1
        if (a.beat_id < b.beat_id) return -1
        if (a.beat_id > b.beat_id) return 1
        return 0
    })
    const overlaps: AgendaReserveOverlap[] = []
    for (let i = 1; i < resolved.length; i++) {
        const prev = resolved[i - 1]
        const next = resolved[i]
        if (prev.valid && next.valid) {
            if (next.reserveStartTick <= prev.targetTick) {
                overlaps.push(
                    Object.freeze({
                        prevBeatId: prev.beat_id,
                        nextBeatId: next.beat_id,
                        prevTargetTick: prev.targetTick,
                        nextReserveStartTick: next.reserveStartTick,
                    }),
                )
            }
        }
    }
    return Object.freeze({
        valid: errors.length === 0,
        errors: Object.freeze([...errors]) as string[],
        resolvedBeats: Object.freeze([...resolved]) as AgendaBeatTickOffset[],
        overlaps: Object.freeze([...overlaps]) as AgendaReserveOverlap[],
    })
}

export const SAKAMOTO_TABLE: readonly number[] = Object.freeze([
    0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4,
])

export const SYNODIC_MONTH_SECONDS = 2551443
export const REF_NEW_MOON_EPOCH_SEC = 947182440

const WEEKDAY_ORDER: readonly WeekdayToken[] = Object.freeze([
    'MON',
    'TUE',
    'WED',
    'THU',
    'FRI',
    'SAT',
    'SUN',
])

export const resolveGregorianWeekday = (isoDate: string): WeekdayToken => {
    if (!isValidGregorianIsoDate(isoDate)) {
        throw new Error(
            `[INVALID_AGENDA_DATE] Invalid calendar date: ${isoDate}`,
        )
    }
    const parts = String(isoDate).split('-').map(Number)
    let y = parts[0]
    const m = parts[1]
    const d = parts[2]
    if (m < 3) y -= 1
    const dow =
        (y +
            Math.floor(y / 4) -
            Math.floor(y / 100) +
            Math.floor(y / 400) +
            SAKAMOTO_TABLE[m - 1] +
            d) %
        7
    const map: readonly WeekdayToken[] = [
        'SUN',
        'MON',
        'TUE',
        'WED',
        'THU',
        'FRI',
        'SAT',
    ]
    return map[((dow % 7) + 7) % 7]
}

export const computeSynodicLunarPhase = (
    isoDate: string,
    startTimeHm = '00:00',
): LunarPhaseSnapshot => {
    if (!isValidGregorianIsoDate(isoDate)) {
        throw new Error(
            `[INVALID_AGENDA_DATE] Invalid calendar date: ${isoDate}`,
        )
    }
    const epochSec = computeGregorianEpochSeconds(
        isoDate,
        normalizeClockTimeHms(startTimeHm),
    )
    const diff = epochSec - REF_NEW_MOON_EPOCH_SEC
    const ageSeconds =
        ((diff % SYNODIC_MONTH_SECONDS) + SYNODIC_MONTH_SECONDS) %
        SYNODIC_MONTH_SECONDS
    const cycleProgressBps = Math.floor(
        (ageSeconds * 10000) / SYNODIC_MONTH_SECONDS,
    )
    let phase: LunarPhaseToken
    if (cycleProgressBps <= 1249 || cycleProgressBps >= 8750) {
        phase = 'NEW_MOON'
    } else if (cycleProgressBps <= 3749) {
        phase = 'FIRST_QUARTER'
    } else if (cycleProgressBps <= 6249) {
        phase = 'FULL_MOON'
    } else {
        phase = 'LAST_QUARTER'
    }
    let illuminationBps: number
    if (cycleProgressBps <= 5000) {
        illuminationBps = cycleProgressBps * 2
    } else {
        illuminationBps = (10000 - cycleProgressBps) * 2
    }
    if (illuminationBps < 0) illuminationBps = 0
    if (illuminationBps > 10000) illuminationBps = 10000
    return Object.freeze({
        phase,
        illuminationBps,
        ageSeconds,
        cycleProgressBps,
    })
}

export const resolveSolarSeasonMarker = (
    isoDate: string,
): SolarMarkerToken | null => {
    if (!isValidGregorianIsoDate(isoDate)) {
        throw new Error(
            `[INVALID_AGENDA_DATE] Invalid calendar date: ${isoDate}`,
        )
    }
    const mmdd = String(isoDate).slice(5)
    if (mmdd === '03-20') return 'VERNAL_EQUINOX'
    if (mmdd === '06-21') return 'SUMMER_SOLSTICE'
    if (mmdd === '09-22') return 'AUTUMN_EQUINOX'
    if (mmdd === '12-21') return 'WINTER_SOLSTICE'
    return null
}

function pad2Local(n: number): string {
    return String(n).padStart(2, '0')
}

function addDaysIso(isoDate: string, offset: number): string {
    const parts = String(isoDate).split('-').map(Number)
    const base =
        daysFromCivil(parts[0], parts[1], parts[2]) + Math.trunc(offset)
    const c = civilFromDays(base)
    return `${String(c.y).padStart(4, '0')}-${pad2Local(c.m)}-${pad2Local(c.d)}`
}

function diffDaysIso(fromIso: string, toIso: string): number {
    const a = String(fromIso).split('-').map(Number)
    const b = String(toIso).split('-').map(Number)
    return daysFromCivil(b[0], b[1], b[2]) - daysFromCivil(a[0], a[1], a[2])
}

export const matchesRecurrenceRuleOnDate = (
    beat: ScheduledBeat,
    isoDate: string,
): boolean => {
    const rule = normalizeBeatRecurrenceRule(beat) as RecurrenceRule
    if (isoDate < beat.isoDate) return false
    if (rule.untilIsoDate !== undefined && isoDate > rule.untilIsoDate)
        return false
    switch (rule.frequency) {
        case 'ONCE':
            return isoDate === beat.isoDate
        case 'DAILY':
            return true
        case 'WEEKLY_MASK': {
            const wd = resolveGregorianWeekday(isoDate)
            return (rule.weekdayMask ?? []).includes(wd)
        }
        case 'INTERVAL_DAYS': {
            const step = Math.trunc(rule.intervalDays ?? 1)
            if (step < 1) return false
            const diff = diffDaysIso(beat.isoDate, isoDate)
            return diff % step === 0
        }
        case 'LUNAR_PHASE': {
            const snap = computeSynodicLunarPhase(isoDate, beat.startTimeHm)
            return snap.phase === rule.lunarPhase
        }
        case 'SOLAR_SOLSTICE_EQUINOX': {
            const marker = resolveSolarSeasonMarker(isoDate)
            if (marker === null) return false
            return (rule.solarMarkers ?? []).includes(marker)
        }
        default:
            return false
    }
}

function isBlackedOutOn(
    rule: RecurrenceRule,
    seriesBlackouts: ReadonlySet<string>,
    isoDate: string,
): boolean {
    if ((rule.blackoutDates ?? []).includes(isoDate)) return true
    if (seriesBlackouts.has(isoDate)) return true
    if ((rule.blackoutWeekdays ?? []).length > 0) {
        const wd = resolveGregorianWeekday(isoDate)
        if ((rule.blackoutWeekdays ?? []).includes(wd)) return true
    }
    return false
}

export const expandRecurrenceOccurrencesInHorizon = (
    chronology: ChronologyConfig,
    horizonDays = 14,
): readonly ExpandedBeatOccurrence[] => {
    const horizon = Math.trunc(Number(horizonDays))
    if (!Number.isInteger(horizon) || horizon < 1 || horizon > 365) {
        throw new Error(`[INVALID_HORIZON] horizonDays must be 1..365`)
    }
    const cfg = resolveChronologyConfig(
        (chronology ?? {}) as Partial<ChronologyConfig>,
    )
    const seriesBlackouts = new Set<string>(
        ((cfg as { series_blackout_dates?: string[] }).series_blackout_dates ??
            []) as string[],
    )
    const beats = sortScheduledBeatsDeterministically([
        ...(((cfg as { scheduled_beats?: ScheduledBeat[] }).scheduled_beats ??
            []) as ScheduledBeat[]),
    ])
    const out: ExpandedBeatOccurrence[] = []
    const perBeatCount = new Map<string, number>()
    for (let d = 0; d <= horizon; d++) {
        const candidate = addDaysIso(cfg.start_date, d)
        for (const beat of beats) {
            const rule = normalizeBeatRecurrenceRule(beat) as RecurrenceRule
            if (!matchesRecurrenceRuleOnDate(beat, candidate)) continue
            const emitted = perBeatCount.get(beat.beat_id) ?? 0
            if (
                rule.maxOccurrences !== undefined &&
                emitted >= Math.trunc(rule.maxOccurrences)
            ) {
                continue
            }
            const policy = rule.blackoutShiftPolicy ?? 'SKIP'
            if (!isBlackedOutOn(rule, seriesBlackouts, candidate)) {
                const off = computeAgendaBeatTickOffset(cfg, {
                    ...beat,
                    isoDate: candidate,
                } as ScheduledBeat)
                const wd = resolveGregorianWeekday(candidate)
                const lunar = computeSynodicLunarPhase(
                    candidate,
                    beat.startTimeHm,
                )
                out.push(
                    Object.freeze({
                        beat_id: beat.beat_id,
                        isoDate: candidate,
                        occurrenceIsoDate: candidate,
                        startTimeHm: beat.startTimeHm,
                        beatCategory: String(beat.beatCategory),
                        targetTick: off.targetTick,
                        reserveStartTick: off.reserveStartTick,
                        reserveCooldownTicks: Math.trunc(
                            beat.reserveCooldownTicks,
                        ),
                        weekday: wd,
                        lunarPhase: lunar.phase,
                        solarMarker: resolveSolarSeasonMarker(candidate),
                        shifted: false,
                        valid: true as const,
                    }),
                )
                perBeatCount.set(beat.beat_id, emitted + 1)
            } else if (policy === 'SKIP') {
                continue
            } else {
                let shiftedDate: string | null = null
                for (let s = 1; s <= 366; s++) {
                    const shiftedCandidate = addDaysIso(candidate, s)
                    if (
                        rule.untilIsoDate !== undefined &&
                        shiftedCandidate > rule.untilIsoDate
                    ) {
                        break
                    }
                    if (
                        !isBlackedOutOn(rule, seriesBlackouts, shiftedCandidate)
                    ) {
                        shiftedDate = shiftedCandidate
                        break
                    }
                }
                if (shiftedDate === null) continue
                const off = computeAgendaBeatTickOffset(cfg, {
                    ...beat,
                    isoDate: shiftedDate,
                } as ScheduledBeat)
                const wd = resolveGregorianWeekday(shiftedDate)
                const lunar = computeSynodicLunarPhase(
                    shiftedDate,
                    beat.startTimeHm,
                )
                const alreadyShifted = out.some(
                    (o) =>
                        o.beat_id === beat.beat_id &&
                        o.occurrenceIsoDate === shiftedDate,
                )
                if (alreadyShifted) continue
                out.push(
                    Object.freeze({
                        beat_id: beat.beat_id,
                        isoDate: shiftedDate,
                        occurrenceIsoDate: shiftedDate,
                        startTimeHm: beat.startTimeHm,
                        beatCategory: String(beat.beatCategory),
                        targetTick: off.targetTick,
                        reserveStartTick: off.reserveStartTick,
                        reserveCooldownTicks: Math.trunc(
                            beat.reserveCooldownTicks,
                        ),
                        weekday: wd,
                        lunarPhase: lunar.phase,
                        solarMarker: resolveSolarSeasonMarker(shiftedDate),
                        shifted: true,
                        shiftedFrom: candidate,
                        valid: true as const,
                    }),
                )
                perBeatCount.set(beat.beat_id, emitted + 1)
            }
        }
    }
    out.sort((a, b) => {
        if (a.targetTick !== b.targetTick) return a.targetTick - b.targetTick
        if (a.isoDate < b.isoDate) return -1
        if (a.isoDate > b.isoDate) return 1
        if (a.beat_id < b.beat_id) return -1
        if (a.beat_id > b.beat_id) return 1
        return 0
    })
    return Object.freeze([...out]) as readonly ExpandedBeatOccurrence[]
}

export const projectRecurrenceHorizon = (
    chronology: ChronologyConfig,
    horizonDays = 14,
): RecurrenceHorizonProjection => {
    const cfg = resolveChronologyConfig(
        (chronology ?? {}) as Partial<ChronologyConfig>,
    )
    const occurrences = expandRecurrenceOccurrencesInHorizon(cfg, horizonDays)
    return Object.freeze({
        startDate: cfg.start_date,
        horizonDays: Math.trunc(horizonDays),
        occurrences,
    })
}

function emitConsole(ste: State | undefined, line: string): void {
    const clean = line.replace(/[^\x00-\x7F]/g, '')
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        try {
            lib.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: clean,
            })
        } catch {}
    } else if (ste && typeof ste.hunt === 'function') {
        try {
            ste.hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: clean,
            })
        } catch {}
    }
}

export const initClock = (
    cpy: ClockModel,
    bal: ClockBit,
    ste?: State,
): ClockModel => {
    cpy.idx = bal.idx || cpy.idx
    if (!cpy.snapshot) {
        try {
            cpy.snapshot = parseCalendarStart(resolveChronologyConfig({}))
        } catch {
            cpy.snapshot = parseCalendarStart(DEFAULT_CHRONOLOGY_CONFIG)
        }
    }
    if (bal.slv) {
        bal.slv({
            clkBit: {
                idx: bal.idx || 'init-clock',
                val: 0,
                dat: { snapshot: cpy.snapshot },
            },
        })
    }
    return cpy
}

export const updateClock = (
    cpy: ClockModel,
    bal: ClockBit,
    ste?: State,
): ClockModel => {
    if (bal.dat?.snapshot) cpy.snapshot = bal.dat.snapshot
    if (bal.slv) {
        bal.slv({
            clkBit: {
                idx: bal.idx || 'update-clock',
                val: 0,
                dat: { snapshot: cpy.snapshot },
            },
        })
    }
    return cpy
}

export const deriveChronology = (
    cpy: ClockModel,
    bal: ClockBit,
    ste?: State,
): ClockModel => {
    const cfg = resolveChronologyConfig(bal?.dat?.chronology ?? bal?.dat ?? {})
    const snap = parseCalendarStart(cfg)
    cpy.snapshot = snap
    const banner = `>> [CLOCK:SYNC] ${snap.isoDate} ${snap.clockTimeHms} | TC ${snap.timecodeSmpte} | DAYPART: ${snap.daypart}`
    cpy.lastFormattedBanner = banner
    emitConsole(ste, banner)
    if (bal.slv) {
        bal.slv({
            clkBit: {
                idx: bal.idx || 'derive-chronology',
                val: 1,
                dat: { snapshot: snap },
            },
            snapshot: snap,
        })
    }
    return cpy
}

export const advanceClock = (
    cpy: ClockModel,
    bal: ClockBit,
    ste?: State,
): ClockModel => {
    if (!cpy.snapshot) {
        cpy.snapshot = parseCalendarStart(DEFAULT_CHRONOLOGY_CONFIG)
    }
    const deltaSeconds = Number(bal?.dat?.deltaSeconds ?? bal?.val ?? 0)
    const deltaCentiseconds = Number(bal?.dat?.deltaCentiseconds ?? 0)
    cpy.snapshot = advanceGregorianClock(
        cpy.snapshot,
        deltaSeconds,
        deltaCentiseconds,
    )
    const snap = cpy.snapshot
    const banner = `>> [CLOCK:SYNC] ${snap.isoDate} ${snap.clockTimeHms} | TC ${snap.timecodeSmpte} | DAYPART: ${snap.daypart}`
    cpy.lastFormattedBanner = banner
    emitConsole(ste, banner)
    if (bal.slv) {
        bal.slv({
            clkBit: {
                idx: bal.idx || 'advance-clock',
                val: 1,
                dat: { snapshot: snap },
            },
            snapshot: snap,
        })
    }
    return cpy
}

export const formatTimecode = (
    cpy: ClockModel,
    bal: ClockBit,
    ste?: State,
): ClockModel => {
    if (!cpy.snapshot) {
        cpy.snapshot = parseCalendarStart(DEFAULT_CHRONOLOGY_CONFIG)
    }
    const snap = cpy.snapshot
    const banner = `>> [CLOCK:SYNC] ${snap.isoDate} ${snap.clockTimeHms} | TC ${snap.timecodeSmpte} | DAYPART: ${snap.daypart}`
    cpy.lastFormattedBanner = banner
    emitConsole(ste, banner)
    if (bal.slv) {
        bal.slv({
            clkBit: {
                idx: bal.idx || 'format-timecode',
                val: 1,
                dat: { timecode: snap.timecodeSmpte, banner },
            },
            timecode: snap.timecodeSmpte,
            banner,
        })
    }
    return cpy
}
