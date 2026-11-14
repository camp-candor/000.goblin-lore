import { describe, it, expect } from 'vitest'
import {
    ActStageSchema,
    ActWindowModeSchema,
    DiurnalTensionWeightsSchema,
    PacingBudgetConfigSchema,
    AutoScriptConfigSchema,
    resolveAutoScriptConfig,
    resolvePacingBudgetConfig,
} from '../38.types.unit/fce/autoScriptRule.interface.js'
import { SeriesConfigSchema } from '../29.series.unit/fce/series.schema.js'

describe('pacing-budget-schema', () => {
    it('exports ActStage and ActWindowMode enums', () => {
        expect(ActStageSchema.parse('ACT_I')).toBe('ACT_I')
        expect(ActStageSchema.parse('ACT_III')).toBe('ACT_III')
        expect(() => ActStageSchema.parse('ACT_IV')).toThrow()
        expect(ActWindowModeSchema.parse('HORIZON_PERCENT')).toBe(
            'HORIZON_PERCENT',
        )
        expect(ActWindowModeSchema.parse('SOLAR_24H_CYCLE')).toBe(
            'SOLAR_24H_CYCLE',
        )
        expect(ActWindowModeSchema.parse('MULTI_DAY_ARC')).toBe('MULTI_DAY_ARC')
    })

    it('applies deterministic defaults', () => {
        const cfg = resolvePacingBudgetConfig(undefined)
        expect(cfg.enabled).toBe(true)
        expect(cfg.min_ticks_between_scenes).toBe(2)
        expect(cfg.min_minutes_between_scenes).toBe(15)
        expect(cfg.max_dry_spell_ticks).toBe(6)
        expect(cfg.drought_boost_bps_per_tick).toBe(650)
        expect(cfg.max_drought_boost_bps).toBe(5500)
        expect(cfg.act_i_end_bps).toBe(3333)
        expect(cfg.act_ii_end_bps).toBe(7500)
        expect(cfg.act_i_multiplier_bps).toBe(8500)
        expect(cfg.act_ii_multiplier_bps).toBe(11500)
        expect(cfg.act_iii_multiplier_bps).toBe(14500)
        expect(cfg.critical_override_bps).toBe(9400)
        expect(cfg.act_window_mode).toBe('HORIZON_PERCENT')
        expect(cfg.diurnal_tension_weights_bps.NIGHT).toBe(12500)
    })

    it('rejects non-monotonic act boundaries fail-closed', () => {
        expect(() =>
            PacingBudgetConfigSchema.parse({
                act_i_end_bps: 7500,
                act_ii_end_bps: 3333,
            }),
        ).toThrow(/OUT_OF_ORDER_ACTS/)
        expect(() =>
            PacingBudgetConfigSchema.parse({
                act_i_end_bps: 5000,
                act_ii_end_bps: 5000,
            }),
        ).toThrow()
    })

    it('rejects floats and negatives', () => {
        expect(() =>
            PacingBudgetConfigSchema.parse({ min_ticks_between_scenes: 2.5 }),
        ).toThrow()
        expect(() =>
            PacingBudgetConfigSchema.parse({ min_ticks_between_scenes: -1 }),
        ).toThrow()
        expect(() =>
            DiurnalTensionWeightsSchema.parse({
                DAWN: 9500.5,
                MORNING: 8500,
                AFTERNOON: 10000,
                DUSK: 11500,
                NIGHT: 12500,
            }),
        ).toThrow()
    })

    it('legacy AutoScriptConfig without pacing_budget parses cleanly', () => {
        const legacy = resolveAutoScriptConfig({ enabled: true })
        expect(legacy.pacing_budget).toBeUndefined()
        const full = AutoScriptConfigSchema.parse({})
        expect(full.pacing_budget).toBeUndefined()
    })

    it('SeriesConfig legacy omitting pacing_budget succeeds', () => {
        const parsed = SeriesConfigSchema.parse({
            schema_version: '1.0.0',
            series_slug: 'test-slug',
            display_name: 'Test Series Display',
            genre_tag: 'STANDARD',
            central_irony: 'A detective who cannot trust memory itself.',
            state_space: {
                scarcity_index_bp: 5000,
                paranoia_baseline_bp: 2500,
                gram_mass_tiers: {
                    scrap_max_grams: 50,
                    weight_max_grams: 5000,
                    bulk_min_grams: 5001,
                },
            },
            action_vocabulary: {
                permitted_kinetic_verbs: ['WALK'],
                locomotion_taxonomies: ['BIPEDAL'],
            },
            invariant_rules: {
                thematic_categories: ['a', 'b', 'c', 'd', 'e', 'f', 'g'],
            },
            medium_projections: { target_fps: 24, audio_sample_rate_hz: 48000 },
        })
        expect(parsed.auto_script).toBeUndefined()
    })

    it('rejects unknown keys strict', () => {
        expect(() =>
            PacingBudgetConfigSchema.parse({ unknown_key: 1 } as any),
        ).toThrow()
    })
})
