import { ClockModel } from '../clock.model.js'
import type ClockBit from '../fce/clock.bit.js'
import type State from '../../99.core/state.js'
import {
    resolveChronologyConfig,
    type ChronologyConfig,
    type CalendarClockSnapshot,
    type DaypartBand,
    normalizeClockTimeHms,
    DEFAULT_CHRONOLOGY_CONFIG,
} from '../../38.types.unit/fce/chronology.interface.js'

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
            365.2425,
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
        isoDate:
            `${pad2(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}`.replace(
                /^(\d{2})-/,
                (m) => m,
            ),
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
    // fix isoDate year padding
    snap.isoDate = `${String(year).padStart(4, '0')}-${pad2(month)}-${pad2(day)}`
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
