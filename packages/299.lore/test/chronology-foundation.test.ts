import { describe, it, expect } from 'vitest'
import {
    isGregorianLeapYear,
    daysInGregorianMonth,
    deriveDaypart,
    formatSmpteTimecode,
    parseCalendarStart,
    advanceGregorianClock,
    resolveChronologyConfig,
} from '../05.clock.unit/buz/clock.buzz'
import {
    ChronologyConfigSchema,
    DEFAULT_CHRONOLOGY_CONFIG,
} from '../38.types.unit/fce/chronology.interface'
import LORE from '../hunt'
import { SeriesConfigSchema } from '../29.series.unit/fce/series.schema'
import {
    configureTickCadence,
    stepTickFrame,
} from '../36.tick.unit/buz/tick.buzz'
import { TickModel } from '../36.tick.unit/tick.model'

describe('chronology foundation', () => {
    it('leap years', () => {
        expect(isGregorianLeapYear(2024)).toBe(true)
        expect(isGregorianLeapYear(2100)).toBe(false)
        expect(isGregorianLeapYear(2000)).toBe(true)
        expect(daysInGregorianMonth(2024, 2)).toBe(29)
        expect(daysInGregorianMonth(2100, 2)).toBe(28)
        expect(daysInGregorianMonth(2000, 2)).toBe(29)
    })
    it('daypart', () => {
        expect(deriveDaypart(5)).toBe('DAWN')
        expect(deriveDaypart(9)).toBe('MORNING')
        expect(deriveDaypart(14)).toBe('AFTERNOON')
        expect(deriveDaypart(18)).toBe('DUSK')
        expect(deriveDaypart(23)).toBe('NIGHT')
    })
    it('smpte', () => {
        expect(formatSmpteTimecode(0, 0, 24)).toBe('00:00:00:00')
        expect(formatSmpteTimecode(3661, 50, 24)).toBe('01:01:01:12')
    })
    it('parse invalid date throws', () => {
        expect(() =>
            parseCalendarStart(
                resolveChronologyConfig({ start_date: '2025-02-29' }),
            ),
        ).toThrow()
    })
    it('schema backward compat', () => {
        const base = {
            schema_version: '1.0.0',
            series_slug: 'test-series',
            display_name: 'Test',
            genre_tag: 'STANDARD',
            central_irony: 'enough chars here',
            state_space: {
                scarcity_index_bp: 0,
                paranoia_baseline_bp: 0,
                somatic_fatigue_enabled: true,
                epistemic_ignorance_enabled: true,
                gram_mass_tiers: {
                    scrap_max_grams: 50,
                    weight_max_grams: 5000,
                    bulk_min_grams: 5001,
                },
            },
            action_vocabulary: {
                permitted_kinetic_verbs: ['WALK'],
                forbidden_verbs_global: [],
                locomotion_taxonomies: ['a'],
            },
            invariant_rules: {
                thematic_categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
            },
            medium_projections: { target_fps: 24, audio_sample_rate_hz: 48000 },
        }
        expect(() => SeriesConfigSchema.parse(base)).not.toThrow()
    })
    it('tick cadence', () => {
        const m = new TickModel()
        configureTickCadence(
            m,
            {
                idx: 't',
                dat: {
                    chronology: { tick_seconds: 30, frames_per_second: 24 },
                },
            } as any,
            undefined,
        )
        expect(m.tickSeconds).toBe(30)
        stepTickFrame(m, { idx: 't', val: 2 } as any, undefined)
        expect(m.tickIndex).toBe(2)
        expect(m.totalElapsedSeconds).toBe(60)
        expect(m.totalFrames).toBe(1440)
    })
    it('advance clock', () => {
        const snap = parseCalendarStart(resolveChronologyConfig({}))
        const next = advanceGregorianClock(snap, 3600)
        expect(typeof next.isoDate).toBe('string')
        expect(next.totalElapsedSeconds).toBe(3600)
    })

    it('rejects invalid schema inputs and non-leap century dates', () => {
        expect(
            ChronologyConfigSchema.safeParse({ start_date: '2026/10/31' })
                .success,
        ).toBe(false)
        expect(
            ChronologyConfigSchema.safeParse({ start_time: '25:99' }).success,
        ).toBe(false)
        expect(
            ChronologyConfigSchema.safeParse({
                start_date: '2026-10-31',
                extra_field: 1,
            }).success,
        ).toBe(false)
        expect(() =>
            parseCalendarStart({
                ...DEFAULT_CHRONOLOGY_CONFIG,
                start_date: '2024-02-29',
            }),
        ).not.toThrow()
        expect(() =>
            parseCalendarStart({
                ...DEFAULT_CHRONOLOGY_CONFIG,
                start_date: '2000-02-29',
            }),
        ).not.toThrow()
        expect(() =>
            parseCalendarStart({
                ...DEFAULT_CHRONOLOGY_CONFIG,
                start_date: '2100-02-29',
            }),
        ).toThrow(/INVALID_CALENDAR_DATE:2100-02-29/)
    })

    it('rolls over leap-day and year-end boundaries deterministically', () => {
        const s1 = parseCalendarStart({
            ...DEFAULT_CHRONOLOGY_CONFIG,
            start_date: '2024-02-28',
            start_time: '23:59:30',
        })
        const r1 = advanceGregorianClock(s1, 30)
        expect(`${r1.isoDate} ${r1.clockTimeHms}`).toBe('2024-02-29 00:00:00')

        const s2 = parseCalendarStart({
            ...DEFAULT_CHRONOLOGY_CONFIG,
            start_date: '2024-02-29',
            start_time: '23:59:30',
        })
        const r2 = advanceGregorianClock(s2, 30)
        expect(`${r2.isoDate} ${r2.clockTimeHms}`).toBe('2024-03-01 00:00:00')

        const s3 = parseCalendarStart({
            ...DEFAULT_CHRONOLOGY_CONFIG,
            start_date: '2026-12-31',
            start_time: '23:59:00',
        })
        const r3 = advanceGregorianClock(s3, 60)
        expect(`${r3.isoDate} ${r3.clockTimeHms}`).toBe('2027-01-01 00:00:00')
        expect(deriveDaypart(2)).toBe('NIGHT')
    })

    it('dispatches clock and tick actions via LORE.hunt', async () => {
        const derived: any = await LORE.hunt(
            '[Clock action] Derive Chronology',
            {
                idx: 'test-derive',
                dat: {
                    chronology: {
                        start_date: '2026-10-31',
                        start_time: '21:00:00',
                        tick_seconds: 60,
                        frames_per_second: 24,
                    },
                },
            },
        )
        expect(derived?.clkBit?.val).toBe(1)
        expect(derived?.clkBit?.dat?.snapshot?.daypart).toBe('NIGHT')

        const advanced: any = await LORE.hunt('[Clock action] Advance Clock', {
            idx: 'test-advance',
            dat: { deltaSeconds: 60 },
        })
        expect(advanced?.clkBit?.val).toBe(1)
        expect(advanced?.clkBit?.dat?.snapshot?.clockTimeHm).toBe('21:01')

        const ticked: any = await LORE.hunt(
            '[Tick action] Configure Tick Cadence',
            {
                idx: 'test-tick',
                dat: {
                    chronology: { tick_seconds: 30, frames_per_second: 24 },
                },
            },
        )
        expect(ticked?.tckBit?.val).toBe(1)
    })
})
