import { describe, it, expect } from 'vitest'
import { SeriesConfigSchema } from '../val/seriesConfig.val.js'

describe('SeriesConfigSchema (Universal Narrative 4-Tuple)', () => {
    const validPayload = {
        series_slug: 'wiregrass-basin',
        display_name: 'Wiregrass Basin',
        genre_tag: 'SOUTHERN_GOTHIC_INDUSTRIAL' as const,
        central_irony:
            'A clan concealing industrial solvent leaks while hunting saboteurs.',
        state_space: {
            scarcity_index_bps: 9200,
            paranoia_baseline_bps: 7500,
            scrap_max_grams: 50,
            weight_max_grams: 5000,
        },
        action_vocabulary: [
            'LIMP',
            'CONCEAL',
            'EXPEND_LEVERAGE',
            'SIPHON',
            'DEFLECT',
        ],
        invariants: {
            max_farce_ratio_bps: 1000,
            global_acoustic_floor_cdb: 1500,
            vo_ducking_db: -14,
            min_grievances_per_dyad: 1,
            min_normalized_category_entropy_bps: 7000,
            thematic_categories: [
                'resource_hoarding',
                'status_anxiety',
                'secret_keeping',
                'generational_rift',
                'territorial_boundary',
                'loyalty_tests',
                'domestic_sabotage',
            ],
        },
        medium_projections: {
            tts_port: 8000,
            comfy_port: 8188,
            lora_trigger_tokens: ['wiregrass_basin_style'],
        },
    }

    it('validates a conformant 4-Tuple payload successfully', () => {
        const result = SeriesConfigSchema.safeParse(validPayload)
        expect(result.success).toBe(true)
    })

    it('fails closed when an un-sanitized slug with spaces is provided', () => {
        const invalid = { ...validPayload, series_slug: 'Wiregrass Basin' }
        const result = SeriesConfigSchema.safeParse(invalid)
        expect(result.success).toBe(false)
    })

    it('fails closed when farce ratio exceeds maximum allowable bound (1500 bps)', () => {
        const invalid = {
            ...validPayload,
            invariants: {
                ...validPayload.invariants,
                max_farce_ratio_bps: 2000,
            },
        }
        const result = SeriesConfigSchema.safeParse(invalid)
        expect(result.success).toBe(false)
    })

    it('fails closed when floating-point numbers are supplied in basis-point fields', () => {
        const invalid = {
            ...validPayload,
            state_space: {
                ...validPayload.state_space,
                scarcity_index_bps: 9200.5,
            },
        }
        const result = SeriesConfigSchema.safeParse(invalid)
        expect(result.success).toBe(false)
    })

    it('fails closed on unknown properties due to strict schema evaluation', () => {
        const invalid = { ...validPayload, unexpected_property: true }
        const result = SeriesConfigSchema.safeParse(invalid)
        expect(result.success).toBe(false)
    })
})
