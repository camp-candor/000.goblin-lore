import { describe, it, expect } from 'vitest'
import {
    SignificantEventCategorySchema,
    AutoScriptRuleSchema,
    AutoScriptConfigSchema,
    resolveAutoScriptConfig,
    DEFAULT_AUTO_SCRIPT_CONFIG,
} from '../38.types.unit/fce/autoScriptRule.interface.js'
import { SeriesConfigSchema } from '../29.series.unit/fce/series.schema.js'
import { evaluateThresholdCrossing } from '../35.threshold.unit/buz/threshold.buzz.js'
import {
    evaluateCatalystSignificance,
    scoreCatalystBatch,
} from '../42.catalyst.unit/buz/catalyst.buzz.js'

function baseSeriesConfig() {
    return {
        schema_version: '1.0.0',
        series_slug: 'test-hearth',
        display_name: 'Test Hearth',
        genre_tag: 'LOW_FANTASY_FARCE',
        central_irony: 'A ledger kept by those who cannot read it at all.',
        state_space: {
            scarcity_index_bp: 1000,
            paranoia_baseline_bp: 1000,
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
            locomotion_taxonomies: ['BIPEDAL_STANDARD'],
        },
        invariant_rules: {
            max_farce_ratio_bp: 1500,
            min_grievance_depth_delta: 1,
            global_acoustic_floor_cdb: 1500,
            voiceover_ducking_db: -14,
            min_normalized_category_entropy_bp: 7000,
            thematic_categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
        },
        medium_projections: {
            target_fps: 24,
            audio_sample_rate_hz: 48000,
        },
    }
}

describe('Narrative Catalyst Significance Contract', () => {
    it('exports significant event categories', () => {
        expect(SignificantEventCategorySchema.options).toContain(
            'PARANOIA_TRIGGERED',
        )
        expect(SignificantEventCategorySchema.options).toContain(
            'GRIEVANCE_BREACH',
        )
        expect(SignificantEventCategorySchema.options).toContain(
            'SOMATIC_TRAUMA',
        )
        expect(SignificantEventCategorySchema.options).toContain(
            'INVENTORY_TRANSFER',
        )
        expect(SignificantEventCategorySchema.options).toContain(
            'EPISTEMIC_REVEAL',
        )
        expect(SignificantEventCategorySchema.options).toContain(
            'CHRONO_MILESTONE',
        )
    })

    it('rejects unknown props via strict schemas', () => {
        expect(() =>
            AutoScriptRuleSchema.parse({
                category: 'PARANOIA_TRIGGERED',
                extra: 1,
            }),
        ).toThrow()
        expect(() =>
            AutoScriptConfigSchema.parse({ enabled: true, extra: 1 }),
        ).toThrow()
    })

    it('supports legacy series configs omitting auto_script', () => {
        const parsed = SeriesConfigSchema.parse(baseSeriesConfig())
        expect(parsed.auto_script).toBeUndefined()
        const resolved = resolveAutoScriptConfig(
            (parsed as any).auto_script ?? {},
        )
        expect(resolved.min_global_significance_bps).toBe(
            DEFAULT_AUTO_SCRIPT_CONFIG.min_global_significance_bps,
        )
    })

    it('accepts explicit auto_script block', () => {
        const parsed = SeriesConfigSchema.parse({
            ...baseSeriesConfig(),
            auto_script: {},
        })
        expect((parsed as any).auto_script).toBeDefined()
    })

    it('scores significant catalyst events deterministically', () => {
        const config = resolveAutoScriptConfig({})
        const a = evaluateCatalystSignificance(config, {
            category: 'PARANOIA_TRIGGERED',
            severityBps: 9000,
            currentTick: 10,
            lastEmittedTickByCategory: {},
        })
        const b = evaluateCatalystSignificance(config, {
            category: 'PARANOIA_TRIGGERED',
            severityBps: 9000,
            currentTick: 10,
            lastEmittedTickByCategory: {},
        })
        expect(a).toEqual(b)
        expect(a.isSignificant).toBe(true)
        expect(a.significanceBps).toBeGreaterThanOrEqual(0)
        expect(a.significanceBps).toBeLessThanOrEqual(10000)
        expect(Object.isFrozen(a)).toBe(true)
    })

    it('rejects disabled categories and cooldown ticks', () => {
        const config = resolveAutoScriptConfig({})
        const low = evaluateCatalystSignificance(config, {
            category: 'PARANOIA_TRIGGERED',
            severityBps: 100,
            currentTick: 10,
            lastEmittedTickByCategory: {},
        })
        expect(low.isSignificant).toBe(false)
        const cool = evaluateCatalystSignificance(config, {
            category: 'PARANOIA_TRIGGERED',
            severityBps: 9000,
            currentTick: 10,
            lastEmittedTickByCategory: { PARANOIA_TRIGGERED: 10 },
        })
        expect(cool.isSignificant).toBe(false)
        expect(cool.reason).toBe('COOLDOWN_ACTIVE')
    })

    it('scores batches deterministically', () => {
        const config = resolveAutoScriptConfig({})
        const batch = scoreCatalystBatch(config, [
            { category: 'SOMATIC_TRAUMA', severityBps: 9000, currentTick: 5 },
            {
                category: 'PARANOIA_TRIGGERED',
                severityBps: 9000,
                currentTick: 5,
            },
        ])
        expect(batch.length).toBe(2)
        expect(batch[0].category).toBe('PARANOIA_TRIGGERED')
    })

    it('evaluates threshold edge crossings', () => {
        expect(evaluateThresholdCrossing(6000, 4000, 5000).kind).toBe(
            'CROSSED_UP',
        )
        expect(evaluateThresholdCrossing(6000, 4000, 5000).crossedUp).toBe(true)
        expect(evaluateThresholdCrossing(4000, 6000, 5000).kind).toBe(
            'CROSSED_DOWN',
        )
        expect(evaluateThresholdCrossing(5000, 5000, 5000).kind).toBe(
            'AT_THRESHOLD',
        )
        expect(evaluateThresholdCrossing(1000, 2000, 5000).kind).toBe('BELOW')
    })

    it('fail-closes on out-of-range basis points', () => {
        expect(() => evaluateThresholdCrossing(-1, 0, 5000)).toThrow()
        expect(() => evaluateThresholdCrossing(10001, 0, 5000)).toThrow()
        expect(() => evaluateThresholdCrossing(5000.5, 0, 5000)).toThrow()
    })
})
