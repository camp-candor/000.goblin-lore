import { describe, it, expect } from 'vitest'
import {
    computeGregorianEpochSeconds,
    computeAgendaBeatTickOffset,
    validateChronoAgendaRegistry,
} from '../05.clock.unit/buz/clock.buzz'
import { evaluateAgendaReserveBlock } from '../06.cooldown.unit/buz/cooldown.buzz'
import { ScheduledBeatSchema } from '../38.types.unit/fce/chronology.interface'

const chrono = {
    calendar_system: 'GREGORIAN_24H',
    start_date: '2026-10-31',
    start_time: '21:00:00',
    tick_seconds: 60,
    frames_per_second: 24,
    timezone_label: 'UTC+00:00',
    era_label: 'CANON_PRESENT',
} as const

const mkBeat = (over: Record<string, unknown>) =>
    ScheduledBeatSchema.parse({
        beat_id: 'test_beat',
        title: 'Test Beat',
        isoDate: '2026-10-31',
        startTimeHm: '23:30',
        beatCategory: 'GRIEVANCE_BREACH',
        reserveCooldownTicks: 2,
        priorityBps: 9500,
        recurringDaily: false,
        toleranceTicks: 0,
        ...over,
    })

describe('chrono agenda timing', () => {
    it('computes integer UTC deltas immune to host TZ', () => {
        const origin = computeGregorianEpochSeconds('2026-10-31', '21:00:00')
        const target = computeGregorianEpochSeconds('2026-10-31', '23:30')
        expect(target - origin).toBe(9000)
        expect(Number.isInteger(origin)).toBe(true)
    })

    it('handles leap-day interval 2024-02-28 to 2024-03-01', () => {
        const a = computeGregorianEpochSeconds('2024-02-28', '00:00:00')
        const b = computeGregorianEpochSeconds('2024-03-01', '00:00:00')
        expect(b - a).toBe(2 * 86400)
    })

    it('handles midnight rollover 23:55 to next day 00:15', () => {
        const a = computeGregorianEpochSeconds('2026-10-31', '23:55')
        const b = computeGregorianEpochSeconds('2026-11-01', '00:15')
        expect(b - a).toBe(1200)
        const off = computeAgendaBeatTickOffset(
            { ...chrono },
            mkBeat({ isoDate: '2026-11-01', startTimeHm: '00:15' }),
        )
        expect(off.valid).toBe(true)
        expect(off.targetTick).toBe(195)
    })

    it('computes targetTick via ceil and reserve window', () => {
        const off = computeAgendaBeatTickOffset(
            { ...chrono },
            mkBeat({ startTimeHm: '23:30', reserveCooldownTicks: 2 }),
        )
        expect(off.valid).toBe(true)
        expect(off.deltaSeconds).toBe(9000)
        expect(off.targetTick).toBe(150)
        expect(off.reserveStartTick).toBe(148)
    })

    it('rejects past non-recurring beats fail-closed', () => {
        const off = computeAgendaBeatTickOffset(
            { ...chrono },
            mkBeat({ isoDate: '2026-10-30', startTimeHm: '12:00' }),
        )
        expect(off.valid).toBe(false)
        expect(off.errorCode).toBe('AGENDA_IN_THE_PAST')
        expect(off.targetTick).toBe(-1)
    })

    it('allows past timestamps for recurringDaily beats', () => {
        const off = computeAgendaBeatTickOffset(
            { ...chrono },
            mkBeat({
                isoDate: '2026-10-30',
                startTimeHm: '12:00',
                recurringDaily: true,
            }),
        )
        expect(off.valid).toBe(true)
        expect(off.targetTick).toBe(0)
        expect(off.reserveStartTick).toBe(0)
    })

    it('validate registry sorts and detects overlaps', () => {
        const b1 = mkBeat({
            beat_id: 'a_first',
            isoDate: '2026-10-31',
            startTimeHm: '22:00',
            reserveCooldownTicks: 2,
        })
        const b2 = mkBeat({
            beat_id: 'b_second',
            isoDate: '2026-10-31',
            startTimeHm: '22:01',
            reserveCooldownTicks: 5,
        })
        const result = validateChronoAgendaRegistry({
            ...chrono,
            scheduled_beats: [b2, b1],
        })
        expect(result.valid).toBe(true)
        expect(result.resolvedBeats[0].beat_id).toBe('a_first')
        expect(result.overlaps.length).toBe(1)
        expect(result.overlaps[0].prevBeatId).toBe('a_first')
        expect(result.overlaps[0].nextBeatId).toBe('b_second')
    })

    it('validate flags past beats invalid', () => {
        const past = mkBeat({ beat_id: 'past_one', isoDate: '2026-10-30' })
        const result = validateChronoAgendaRegistry({
            ...chrono,
            scheduled_beats: [past],
        })
        expect(result.valid).toBe(false)
        expect(result.errors.join(' ')).toContain('AGENDA_IN_THE_PAST')
    })

    it('reserve hold blocks filler inside window', () => {
        const resolved = [
            {
                beat_id: 'hold_me',
                beatCategory: 'GRIEVANCE_BREACH',
                targetTick: 150,
                reserveStartTick: 148,
            },
        ]
        const held = evaluateAgendaReserveBlock(149, resolved as never)
        expect(held.heldByReserve).toBe(true)
        expect(held.beatId).toBe('hold_me')
        expect(held.ticksUntilBeat).toBe(1)
        const clear = evaluateAgendaReserveBlock(100, resolved as never)
        expect(clear.heldByReserve).toBe(false)
        const atTarget = evaluateAgendaReserveBlock(150, resolved as never)
        expect(atTarget.heldByReserve).toBe(false)
    })

    it('matches 900s tick rollover and reserve countdown window', () => {
        const rolloverChrono = {
            ...chrono,
            start_date: '2026-10-31',
            start_time: '23:00:00',
            tick_seconds: 900,
        }
        const off = computeAgendaBeatTickOffset(
            rolloverChrono,
            mkBeat({
                beat_id: 'curfew_0030',
                isoDate: '2026-11-01',
                startTimeHm: '00:30',
                reserveCooldownTicks: 2,
            }),
        )
        expect(off.valid).toBe(true)
        expect(off.deltaSeconds).toBe(5400)
        expect(off.targetTick).toBe(6)
        expect(off.reserveStartTick).toBe(4)
        expect(evaluateAgendaReserveBlock(3, [off]).heldByReserve).toBe(false)
        expect(evaluateAgendaReserveBlock(4, [off])).toMatchObject({
            heldByReserve: true,
            ticksUntilBeat: 2,
        })
        expect(evaluateAgendaReserveBlock(5, [off])).toMatchObject({
            heldByReserve: true,
            ticksUntilBeat: 1,
        })
    })
})
