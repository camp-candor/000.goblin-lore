import { describe, it, expect } from 'vitest'
import {
    ScheduledBeatSchema,
    ChronologyConfigSchema,
    ChronoAgendaRegistrySchema,
    sortScheduledBeatsDeterministically,
    isValidGregorianIsoDate,
} from '../38.types.unit/fce/chronology.interface'
import { SeriesConfigSchema } from '../29.series.unit/fce/series.schema'

const baseSeries = {
    schema_version: '1.0.0',
    series_slug: 'test-series',
    display_name: 'Test',
    genre_tag: 'STANDARD',
    central_irony: 'enough chars here for irony test',
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

const validBeat = {
    beat_id: 'midnight_curfew',
    title: 'Midnight Curfew',
    isoDate: '2026-10-31',
    startTimeHm: '23:30',
    beatCategory: 'GRIEVANCE_BREACH',
}

describe('chrono agenda schema', () => {
    it('parses valid beats with defaults', () => {
        const beat = ScheduledBeatSchema.parse(validBeat)
        expect(beat.reserveCooldownTicks).toBe(2)
        expect(beat.priorityBps).toBe(9500)
        expect(beat.recurringDaily).toBe(false)
        expect(beat.toleranceTicks).toBe(0)
    })

    it('accepts leap day 2024-02-29 and rejects 2025-02-29', () => {
        expect(isValidGregorianIsoDate('2024-02-29')).toBe(true)
        expect(isValidGregorianIsoDate('2025-02-29')).toBe(false)
        expect(isValidGregorianIsoDate('2000-02-29')).toBe(true)
        expect(isValidGregorianIsoDate('2100-02-29')).toBe(false)
        expect(isValidGregorianIsoDate('2026-10-31')).toBe(true)
        const bad = ScheduledBeatSchema.safeParse({
            ...validBeat,
            isoDate: '2025-02-29',
        })
        expect(bad.success).toBe(false)
        const good = ScheduledBeatSchema.safeParse({
            ...validBeat,
            isoDate: '2024-02-29',
        })
        expect(good.success).toBe(true)
    })

    it('rejects invalid startTimeHm and beat_id formats', () => {
        expect(
            ScheduledBeatSchema.safeParse({
                ...validBeat,
                startTimeHm: '24:60',
            }).success,
        ).toBe(false)
        expect(
            ScheduledBeatSchema.safeParse({ ...validBeat, beat_id: 'Bad-Id!' })
                .success,
        ).toBe(false)
    })

    it('rejects duplicate beat_id via ChronologyConfigSchema superRefine', () => {
        const dup = ChronologyConfigSchema.safeParse({
            start_date: '2026-10-31',
            start_time: '21:00:00',
            scheduled_beats: [
                validBeat,
                { ...validBeat, startTimeHm: '23:45' },
            ],
        })
        expect(dup.success).toBe(false)
        if (!dup.success) {
            const msgs = dup.error.issues.map((i) => i.message).join(' ')
            expect(msgs).toContain('DUPLICATE_AGENDA_BEAT_ID')
        }
    })

    it('sorts beats deterministically without mutating input', () => {
        const beats = [
            ScheduledBeatSchema.parse({
                ...validBeat,
                beat_id: 'b_b',
                isoDate: '2026-11-01',
                startTimeHm: '08:00',
            }),
            ScheduledBeatSchema.parse({
                ...validBeat,
                beat_id: 'a_a',
                isoDate: '2026-10-31',
                startTimeHm: '23:30',
            }),
            ScheduledBeatSchema.parse({
                ...validBeat,
                beat_id: 'c_c',
                isoDate: '2026-10-31',
                startTimeHm: '22:00',
            }),
        ]
        const originalOrder = beats.map((b) => b.beat_id)
        const sorted = sortScheduledBeatsDeterministically(beats)
        expect(sorted.map((b) => b.beat_id)).toEqual(['c_c', 'a_a', 'b_b'])
        expect(beats.map((b) => b.beat_id)).toEqual(originalOrder)
        expect(sorted).not.toBe(beats)
    })

    it('legacy SeriesConfig without scheduled_beats parses cleanly', () => {
        expect(() => SeriesConfigSchema.parse(baseSeries)).not.toThrow()
        const parsed = SeriesConfigSchema.parse(baseSeries)
        expect(parsed.chronology).toBeUndefined()
        const withChrono = SeriesConfigSchema.parse({
            ...baseSeries,
            chronology: { start_date: '2026-10-31' },
        })
        expect((withChrono.chronology as any)?.scheduled_beats).toBeUndefined()
    })

    it('rejects unknown fields via strict()', () => {
        const bad = ScheduledBeatSchema.safeParse({
            ...validBeat,
            unknown_field: 1,
        })
        expect(bad.success).toBe(false)
        const badChrono = ChronologyConfigSchema.safeParse({
            start_date: '2026-10-31',
            extra_field: 1,
        })
        expect(badChrono.success).toBe(false)
    })

    it('enforces integer bounds on reserveCooldownTicks and priorityBps', () => {
        expect(
            ScheduledBeatSchema.safeParse({
                ...validBeat,
                reserveCooldownTicks: 1001,
            }).success,
        ).toBe(false)
        expect(
            ScheduledBeatSchema.safeParse({ ...validBeat, priorityBps: 10001 })
                .success,
        ).toBe(false)
        expect(
            ScheduledBeatSchema.safeParse({
                ...validBeat,
                reserveCooldownTicks: 1.5,
            }).success,
        ).toBe(false)
    })

    it('registry max 256 enforced', () => {
        const many = Array.from({ length: 257 }, (_, i) => ({
            ...validBeat,
            beat_id: `beat_${i}`,
        }))
        expect(ChronoAgendaRegistrySchema.safeParse(many).success).toBe(false)
    })
})
