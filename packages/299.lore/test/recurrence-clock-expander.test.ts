import { describe, it, expect } from 'vitest'
import {
    resolveGregorianWeekday,
    computeSynodicLunarPhase,
    resolveSolarSeasonMarker,
    expandRecurrenceOccurrencesInHorizon,
} from '../05.clock.unit/buz/clock.buzz'
import { evaluateAgendaReserveBlock } from '../06.cooldown.unit/buz/cooldown.buzz'

const chronoBase = {
    calendar_system: 'GREGORIAN_24H',
    start_date: '2026-10-31',
    start_time: '21:00:00',
    tick_seconds: 60,
    frames_per_second: 24,
    timezone_label: 'UTC+00:00',
    era_label: 'CANON_PRESENT',
} as const

const beat = (
    beat_id: string,
    isoDate: string,
    extra: Record<string, unknown> = {},
) => ({
    beat_id,
    title: beat_id,
    isoDate,
    startTimeHm: '09:00',
    beatCategory: 'GRIEVANCE_BREACH',
    reserveCooldownTicks: 2,
    priorityBps: 9500,
    recurringDaily: false,
    toleranceTicks: 0,
    ...extra,
})

describe('recurrence clock expander', () => {
    it('resolves Sakamoto weekdays', () => {
        expect(resolveGregorianWeekday('2026-10-30')).toBe('FRI')
        expect(resolveGregorianWeekday('2026-10-31')).toBe('SAT')
        expect(resolveGregorianWeekday('2026-11-01')).toBe('SUN')
        expect(resolveGregorianWeekday('2024-02-29')).toBe('THU')
    })

    it('computes synodic lunar phase with integer math', () => {
        const snap = computeSynodicLunarPhase('2026-10-31', '09:00')
        expect(Object.isFrozen(snap)).toBe(true)
        expect(snap.illuminationBps).toBeGreaterThanOrEqual(0)
        expect(snap.illuminationBps).toBeLessThanOrEqual(10000)
        expect(snap.ageSeconds).toBeGreaterThanOrEqual(0)
        expect(snap.cycleProgressBps).toBeGreaterThanOrEqual(0)
        expect(snap.cycleProgressBps).toBeLessThanOrEqual(10000)
        expect([
            'NEW_MOON',
            'FIRST_QUARTER',
            'FULL_MOON',
            'LAST_QUARTER',
        ]).toContain(snap.phase)
    })

    it('resolves solar markers', () => {
        expect(resolveSolarSeasonMarker('2026-03-20')).toBe('VERNAL_EQUINOX')
        expect(resolveSolarSeasonMarker('2026-06-21')).toBe('SUMMER_SOLSTICE')
        expect(resolveSolarSeasonMarker('2026-09-22')).toBe('AUTUMN_EQUINOX')
        expect(resolveSolarSeasonMarker('2026-12-21')).toBe('WINTER_SOLSTICE')
        expect(resolveSolarSeasonMarker('2026-10-31')).toBeNull()
    })

    it('expands WEEKLY_MASK across horizon', () => {
        const chrono = {
            ...chronoBase,
            scheduled_beats: [
                beat('friday_court', '2026-10-31', {
                    recurrenceRule: {
                        frequency: 'WEEKLY_MASK',
                        weekdayMask: ['FRI'],
                    },
                }),
            ],
        }
        const occ = expandRecurrenceOccurrencesInHorizon(chrono as never, 14)
        expect(occ.length).toBeGreaterThanOrEqual(2)
        for (const o of occ) expect(o.weekday).toBe('FRI')
        expect(Object.isFrozen(occ)).toBe(true)
    })

    it('expands INTERVAL_DAYS cadence', () => {
        const chrono = {
            ...chronoBase,
            scheduled_beats: [
                beat('interval_watch', '2026-10-31', {
                    recurrenceRule: {
                        frequency: 'INTERVAL_DAYS',
                        intervalDays: 3,
                    },
                }),
            ],
        }
        const occ = expandRecurrenceOccurrencesInHorizon(chrono as never, 14)
        const dates = occ.map((o) => o.isoDate)
        expect(dates).toContain('2026-10-31')
        expect(dates).toContain('2026-11-03')
        expect(dates).toContain('2026-11-06')
    })

    it('honors SKIP vs DEFER_NEXT_VALID_DAY blackouts', () => {
        const skipChrono = {
            ...chronoBase,
            scheduled_beats: [
                beat('daily_skip', '2026-10-31', {
                    recurrenceRule: {
                        frequency: 'DAILY',
                        blackoutDates: ['2026-11-01'],
                        blackoutShiftPolicy: 'SKIP',
                    },
                }),
            ],
        }
        const skipOcc = expandRecurrenceOccurrencesInHorizon(
            skipChrono as never,
            7,
        )
        expect(skipOcc.map((o) => o.isoDate)).not.toContain('2026-11-01')

        const deferChrono = {
            ...chronoBase,
            scheduled_beats: [
                beat('daily_defer', '2026-10-31', {
                    recurrenceRule: {
                        frequency: 'DAILY',
                        blackoutDates: ['2026-11-01'],
                        blackoutShiftPolicy: 'DEFER_NEXT_VALID_DAY',
                    },
                }),
            ],
        }
        const deferOcc = expandRecurrenceOccurrencesInHorizon(
            deferChrono as never,
            7,
        )
        const shifted = deferOcc.find((o) => o.shiftedFrom === '2026-11-01')
        expect(shifted).toBeDefined()
        expect(shifted?.isoDate).toBe('2026-11-02')
    })

    it('enforces untilIsoDate and maxOccurrences caps', () => {
        const chrono = {
            ...chronoBase,
            scheduled_beats: [
                beat('capped', '2026-10-31', {
                    recurrenceRule: {
                        frequency: 'DAILY',
                        untilIsoDate: '2026-11-02',
                        maxOccurrences: 2,
                    },
                }),
            ],
        }
        const occ = expandRecurrenceOccurrencesInHorizon(chrono as never, 14)
        expect(occ.length).toBe(2)
        expect(occ.map((o) => o.isoDate)).toEqual(['2026-10-31', '2026-11-01'])
    })

    it('reserve window suppresses skipped blackout dates', () => {
        const chrono = {
            ...chronoBase,
            tick_seconds: 86400,
            scheduled_beats: [
                beat('reserved', '2026-10-31', {
                    reserveCooldownTicks: 1,
                    recurrenceRule: {
                        frequency: 'DAILY',
                        blackoutDates: ['2026-11-01'],
                        blackoutShiftPolicy: 'SKIP',
                    },
                }),
            ],
        }
        const occ = expandRecurrenceOccurrencesInHorizon(chrono as never, 7)
        expect(occ.map((o) => o.isoDate)).not.toContain('2026-11-01')
        const held = evaluateAgendaReserveBlock(1, occ as never)
        expect(held.heldByReserve).toBe(true)
        const chronoHeld = evaluateAgendaReserveBlock(1, chrono as never, 7)
        expect(chronoHeld.heldByReserve).toBe(true)
    })

    it('expands LUNAR_PHASE and SOLAR_SOLSTICE_EQUINOX in horizon', () => {
        const lunarChrono = {
            ...chronoBase,
            start_date: '2026-10-31',
            scheduled_beats: [
                beat('lunar_vigil', '2026-10-31', {
                    recurrenceRule: {
                        frequency: 'LUNAR_PHASE',
                        lunarPhase: 'FULL_MOON',
                    },
                }),
            ],
        }
        const lunarOcc = expandRecurrenceOccurrencesInHorizon(
            lunarChrono as never,
            30,
        )
        expect(lunarOcc.length).toBeGreaterThan(0)
        for (const o of lunarOcc) {
            expect(o.lunarPhase).toBe('FULL_MOON')
        }

        const solarChrono = {
            ...chronoBase,
            start_date: '2026-12-15',
            scheduled_beats: [
                beat('solstice_rite', '2026-12-15', {
                    recurrenceRule: {
                        frequency: 'SOLAR_SOLSTICE_EQUINOX',
                        solarMarkers: ['WINTER_SOLSTICE'],
                    },
                }),
            ],
        }
        const solarOcc = expandRecurrenceOccurrencesInHorizon(
            solarChrono as never,
            14,
        )
        expect(solarOcc.map((o) => o.isoDate)).toEqual(['2026-12-21'])
        expect(solarOcc[0].solarMarker).toBe('WINTER_SOLSTICE')
    })

    it('skips or defers Friday 2026-10-30 blackout to Saturday 2026-10-31', () => {
        const fridayBase = {
            ...chronoBase,
            start_date: '2026-10-30',
            start_time: '08:00:00',
            tick_seconds: 86400,
        }
        const skipChrono = {
            ...fridayBase,
            scheduled_beats: [
                beat('friday_court', '2026-10-30', {
                    reserveCooldownTicks: 0,
                    recurrenceRule: {
                        frequency: 'WEEKLY_MASK',
                        weekdayMask: ['FRI'],
                        blackoutDates: ['2026-10-30'],
                        blackoutShiftPolicy: 'SKIP',
                    },
                }),
            ],
        }
        const skipOcc = expandRecurrenceOccurrencesInHorizon(
            skipChrono as never,
            14,
        )
        expect(skipOcc.map((o) => o.isoDate)).not.toContain('2026-10-30')
        const reserveOnFriday = evaluateAgendaReserveBlock(
            0,
            skipChrono as never,
            14,
        )
        expect(reserveOnFriday.heldByReserve).toBe(false)

        const deferChrono = {
            ...fridayBase,
            scheduled_beats: [
                beat('friday_court', '2026-10-30', {
                    recurrenceRule: {
                        frequency: 'WEEKLY_MASK',
                        weekdayMask: ['FRI'],
                        blackoutDates: ['2026-10-30'],
                        blackoutShiftPolicy: 'DEFER_NEXT_VALID_DAY',
                    },
                }),
            ],
        }
        const deferOcc = expandRecurrenceOccurrencesInHorizon(
            deferChrono as never,
            14,
        )
        const shifted = deferOcc.find((o) => o.shiftedFrom === '2026-10-30')
        expect(shifted).toBeDefined()
        expect(shifted?.isoDate).toBe('2026-10-31')
        expect(shifted?.weekday).toBe('SAT')
    })
})
