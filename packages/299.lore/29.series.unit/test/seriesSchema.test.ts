import { describe, it, expect } from 'vitest'
import {
    SeriesConfigSchema,
    StateSpaceSchema,
    ActionVocabularySchema,
    InvariantRulesSchema,
    MediumProjectionsSchema,
    type SeriesConfig,
} from '../fce/series.schema.js'

describe('Phase 4 Universal Narrative Four-Tuple Schema Gauntlet', () => {
    const validCanonicalConfig: SeriesConfig = {
        schema_version: '1.0.0',
        series_slug: 'under-the-floorboards',
        display_name: 'Under the Floorboards',
        genre_tag: 'LOW_FANTASY_FARCE',
        central_irony:
            'Goblins hoard worthless broken scrap while starving beneath abundance.',
        state_space: {
            scarcity_index_bp: 9200,
            paranoia_baseline_bp: 7500,
            somatic_fatigue_enabled: true,
            epistemic_ignorance_enabled: true,
            gram_mass_tiers: {
                scrap_max_grams: 50,
                weight_max_grams: 5000,
                bulk_min_grams: 5001,
            },
        },
        action_vocabulary: {
            permitted_kinetic_verbs: [
                'LIMP',
                'CONCEAL',
                'EXPEND_LEVERAGE',
                'SIPHON',
                'DEFLECT',
            ],
            forbidden_verbs_global: ['fly', 'teleport'],
            locomotion_taxonomies: [
                'BIPEDAL_NIMBLE',
                'BIPEDAL_HUNCHED',
                'LIMPING',
                'IMMOBILE',
            ],
        },
        invariant_rules: {
            max_farce_ratio_bp: 1500,
            min_grievance_depth_delta: 1,
            global_acoustic_floor_cdb: 1500,
            voiceover_ducking_db: -14,
            min_normalized_category_entropy_bp: 7000,
            thematic_categories: [
                'RESOURCE_HOARDING',
                'STATUS_ENCROACHMENT',
                'TERRITORIAL_TRESPASS',
                'SPOON_DISPUTE',
                'LABOR_AVOIDANCE',
                'DEBT_EVASION',
                'LINEAGE_INSULT',
            ],
        },
        medium_projections: {
            target_fps: 24,
            audio_sample_rate_hz: 48000,
            tts_service_port: 8000,
            video_service_port: 8188,
            aspect_ratio: '16:9',
        },
    }

    it('validates a fully compliant Universal Narrative Four-Tuple series config', () => {
        const parsed = SeriesConfigSchema.parse(validCanonicalConfig)
        expect(parsed.series_slug).toBe('under-the-floorboards')
        expect(parsed.genre_tag).toBe('LOW_FANTASY_FARCE')
        expect(parsed.invariant_rules.max_farce_ratio_bp).toBe(1500)
        expect(parsed.medium_projections.target_fps).toBe(24)
        expect(parsed.medium_projections.audio_sample_rate_hz).toBe(48000)
    })

    it('rejects floating-point numbers in StateSpace basis points with FLOAT_PROHIBITED', () => {
        expect(() =>
            StateSpaceSchema.parse({
                scarcity_index_bp: 9200.5,
                paranoia_baseline_bp: 7500,
                somatic_fatigue_enabled: true,
                epistemic_ignorance_enabled: true,
                gram_mass_tiers: {
                    scrap_max_grams: 50,
                    weight_max_grams: 5000,
                    bulk_min_grams: 5001,
                },
            }),
        ).toThrow('[FLOAT_PROHIBITED]')
    })

    it('rejects lowercase kinetic verbs in ActionVocabulary', () => {
        expect(() =>
            ActionVocabularySchema.parse({
                permitted_kinetic_verbs: ['LIMP', 'siphon', 'CONCEAL'],
                forbidden_verbs_global: [],
                locomotion_taxonomies: ['BIPEDAL'],
            }),
        ).toThrow('[INVALID_VERB_FORMAT]')
    })

    it('rejects max_farce_ratio_bp exceeding 1500 basis points in InvariantRules', () => {
        expect(() =>
            InvariantRulesSchema.parse({
                max_farce_ratio_bp: 1501,
                min_grievance_depth_delta: 1,
                global_acoustic_floor_cdb: 1500,
                voiceover_ducking_db: -14,
                min_normalized_category_entropy_bp: 7000,
                thematic_categories: [
                    'CAT_1',
                    'CAT_2',
                    'CAT_3',
                    'CAT_4',
                    'CAT_5',
                    'CAT_6',
                    'CAT_7',
                ],
            }),
        ).toThrow('[OUT_OF_BOUNDS]')
    })

    it('rejects thematic_categories arrays that do not have exactly 7 entries', () => {
        expect(() =>
            InvariantRulesSchema.parse({
                max_farce_ratio_bp: 1200,
                min_grievance_depth_delta: 1,
                global_acoustic_floor_cdb: 1500,
                voiceover_ducking_db: -14,
                min_normalized_category_entropy_bp: 7000,
                thematic_categories: ['CAT_1', 'CAT_2', 'CAT_3'],
            }),
        ).toThrow('[THEMATIC_CATEGORY_COUNT_MISMATCH]')
    })

    it('rejects target_fps other than 24 in MediumProjections', () => {
        expect(() =>
            MediumProjectionsSchema.parse({
                target_fps: 30,
                audio_sample_rate_hz: 48000,
                tts_service_port: 8000,
                video_service_port: 8188,
                aspect_ratio: '16:9',
            }),
        ).toThrow('[FPS_MISMATCH]')
    })

    it('rejects audio_sample_rate_hz other than 48000 in MediumProjections', () => {
        expect(() =>
            MediumProjectionsSchema.parse({
                target_fps: 24,
                audio_sample_rate_hz: 44100,
                tts_service_port: 8000,
                video_service_port: 8188,
                aspect_ratio: '16:9',
            }),
        ).toThrow('[SAMPLE_RATE_MISMATCH]')
    })

    it('rejects central_irony shorter than 10 characters', () => {
        const invalidConfig = {
            ...validCanonicalConfig,
            central_irony: 'Too short',
        }
        expect(() => SeriesConfigSchema.parse(invalidConfig)).toThrow(
            '[CENTRAL_IRONY_TOO_SHORT]',
        )
    })

    it('rejects unknown unrecognized properties via strict mode', () => {
        const rogueConfig = {
            ...validCanonicalConfig,
            hallucinated_property: 'not allowed',
        }
        expect(() => SeriesConfigSchema.parse(rogueConfig)).toThrow()
    })
})
