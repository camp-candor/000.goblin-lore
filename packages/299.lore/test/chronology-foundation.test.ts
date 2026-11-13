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
})
