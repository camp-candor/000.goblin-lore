import { describe, it, expect } from 'vitest'
import {
    WeekdayTokenSchema,
    LunarPhaseTokenSchema,
    SolarMarkerTokenSchema,
    BlackoutShiftPolicySchema,
    RecurrenceRuleSchema,
    ScheduledBeatSchema,
    ChronologyConfigSchema,
    normalizeBeatRecurrenceRule,
} from '../38.types.unit/fce/chronology.interface'

const baseBeat = {
    beat_id: 'court_session',
    title: 'Court Session',
    isoDate: '2026-10-31',
    startTimeHm: '09:00',
    beatCategory: 'GRIEVANCE_BREACH',
}

describe('recurrence grammar schema', () => {
    it('exports token enums', () => {
        expect(WeekdayTokenSchema.options).toEqual([
            'MON',
            'TUE',
            'WED',
            'THU',
            'FRI',
            'SAT',
            'SUN',
        ])
        expect(LunarPhaseTokenSchema.options).toContain('FULL_MOON')
        expect(SolarMarkerTokenSchema.options).toContain('WINTER_SOLSTICE')
        expect(BlackoutShiftPolicySchema.options).toEqual([
            'SKIP',
            'DEFER_NEXT_VALID_DAY',
        ])
    })

    it('parses all 6 recurrence frequencies', () => {
        const freqs: Array<{
            frequency: string
            extra: Record<string, unknown>
        }> = [
            { frequency: 'ONCE', extra: {} },
            { frequency: 'DAILY', extra: {} },
            { frequency: 'WEEKLY_MASK', extra: { weekdayMask: ['FRI'] } },
            { frequency: 'INTERVAL_DAYS', extra: { intervalDays: 3 } },
            { frequency: 'LUNAR_PHASE', extra: { lunarPhase: 'FULL_MOON' } },
            {
                frequency: 'SOLAR_SOLSTICE_EQUINOX',
                extra: { solarMarkers: ['WINTER_SOLSTICE'] },
            },
        ]
        for (const f of freqs) {
            const r = RecurrenceRuleSchema.safeParse({
                frequency: f.frequency,
                ...f.extra,
            })
            expect(r.success).toBe(true)
        }
    })

    it('rejects missing discriminators fail-closed', () => {
        const w = RecurrenceRuleSchema.safeParse({ frequency: 'WEEKLY_MASK' })
        expect(w.success).toBe(false)
        if (!w.success)
            expect(w.error.issues.map((i) => i.message).join(' ')).toContain(
                'RECURRENCE_MISSING_WEEKDAY_MASK',
            )
        const iv = RecurrenceRuleSchema.safeParse({
            frequency: 'INTERVAL_DAYS',
        })
        expect(iv.success).toBe(false)
        if (!iv.success)
            expect(iv.error.issues.map((i) => i.message).join(' ')).toContain(
                'RECURRENCE_MISSING_INTERVAL_DAYS',
            )
        const lp = RecurrenceRuleSchema.safeParse({ frequency: 'LUNAR_PHASE' })
        expect(lp.success).toBe(false)
        if (!lp.success)
            expect(lp.error.issues.map((i) => i.message).join(' ')).toContain(
                'RECURRENCE_MISSING_LUNAR_PHASE',
            )
        const sm = RecurrenceRuleSchema.safeParse({
            frequency: 'SOLAR_SOLSTICE_EQUINOX',
        })
        expect(sm.success).toBe(false)
        if (!sm.success)
            expect(sm.error.issues.map((i) => i.message).join(' ')).toContain(
                'RECURRENCE_MISSING_SOLAR_MARKERS',
            )
    })

    it('validates blackout leap-year traps', () => {
        const bad = RecurrenceRuleSchema.safeParse({
            frequency: 'DAILY',
            blackoutDates: ['2025-02-29'],
        })
        expect(bad.success).toBe(false)
        if (!bad.success)
            expect(bad.error.issues.map((i) => i.message).join(' ')).toContain(
                'INVALID_BLACKOUT_DATE',
            )
        const good = RecurrenceRuleSchema.safeParse({
            frequency: 'DAILY',
            blackoutDates: ['2024-02-29'],
        })
        expect(good.success).toBe(true)
        const badUntil = RecurrenceRuleSchema.safeParse({
            frequency: 'DAILY',
            untilIsoDate: '2025-02-29',
        })
        expect(badUntil.success).toBe(false)
        if (!badUntil.success)
            expect(
                badUntil.error.issues.map((i) => i.message).join(' '),
            ).toContain('INVALID_UNTIL_DATE')
        const badSeries = ChronologyConfigSchema.safeParse({
            start_date: '2026-10-31',
            series_blackout_dates: ['2025-02-29'],
        })
        expect(badSeries.success).toBe(false)
        if (!badSeries.success)
            expect(
                badSeries.error.issues.map((i) => i.message).join(' '),
            ).toContain('INVALID_BLACKOUT_DATE')
    })

    it('rejects untilIsoDate before beat isoDate', () => {
        const r = ScheduledBeatSchema.safeParse({
            ...baseBeat,
            recurrenceRule: { frequency: 'DAILY', untilIsoDate: '2026-10-30' },
        })
        expect(r.success).toBe(false)
        if (!r.success)
            expect(r.error.issues.map((i) => i.message).join(' ')).toContain(
                'RECURRENCE_UNTIL_BEFORE_START',
            )
        const ok = ScheduledBeatSchema.safeParse({
            ...baseBeat,
            recurrenceRule: { frequency: 'DAILY', untilIsoDate: '2026-11-30' },
        })
        expect(ok.success).toBe(true)
    })

    it('normalizes legacy recurringDaily', () => {
        const daily = normalizeBeatRecurrenceRule({
            ...baseBeat,
            recurringDaily: true,
        } as never)
        expect(daily.frequency).toBe('DAILY')
        expect(daily.blackoutShiftPolicy).toBe('SKIP')
        const once = normalizeBeatRecurrenceRule({
            ...baseBeat,
            recurringDaily: false,
        } as never)
        expect(once.frequency).toBe('ONCE')
        const legacy = ScheduledBeatSchema.safeParse(baseBeat)
        expect(legacy.success).toBe(true)
        const withSeries = ChronologyConfigSchema.safeParse({
            start_date: '2026-10-31',
        })
        expect(withSeries.success).toBe(true)
    })

    it('accepts series_blackout_dates and recurrenceRule on beats', () => {
        const r = ScheduledBeatSchema.safeParse({
            ...baseBeat,
            recurrenceRule: {
                frequency: 'WEEKLY_MASK',
                weekdayMask: ['FRI'],
                blackoutShiftPolicy: 'DEFER_NEXT_VALID_DAY',
            },
        })
        expect(r.success).toBe(true)
        const c = ChronologyConfigSchema.safeParse({
            start_date: '2026-10-31',
            series_blackout_dates: ['2026-12-25'],
            scheduled_beats: [baseBeat],
        })
        expect(c.success).toBe(true)
    })
})
