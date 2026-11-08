import { z } from 'zod'

/**
 * 7-bit ASCII Slug Regular Expression for Series Identifiers.
 */
export const SeriesSlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Closed Genre Modality Taxonomy.
 */
export const GenreModalityEnum = z.enum([
    'LOW_FANTASY_FARCE',
    'SOUTHERN_GOTHIC_INDUSTRIAL',
    'HARD_SCIFI_VACUUM',
])
export type GenreModality = z.infer<typeof GenreModalityEnum>

/**
 * Part 1: Universal State Space (S)
 * Enforces basis-point scarcity, baseline paranoia, and gram mass tiers.
 */
export const StateSpaceSchema = z
    .object({
        scarcity_index_bp: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] scarcity_index_bp must be an integer',
            })
            .min(0, {
                message: '[OUT_OF_BOUNDS] scarcity_index_bp cannot be negative',
            })
            .max(10000, {
                message:
                    '[OUT_OF_BOUNDS] scarcity_index_bp cannot exceed 10000 basis points',
            }),
        paranoia_baseline_bp: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] paranoia_baseline_bp must be an integer',
            })
            .min(0, {
                message:
                    '[OUT_OF_BOUNDS] paranoia_baseline_bp cannot be negative',
            })
            .max(10000, {
                message:
                    '[OUT_OF_BOUNDS] paranoia_baseline_bp cannot exceed 10000 basis points',
            }),
        somatic_fatigue_enabled: z.boolean().default(true),
        epistemic_ignorance_enabled: z.boolean().default(true),
        gram_mass_tiers: z
            .object({
                scrap_max_grams: z
                    .number()
                    .int({
                        message:
                            '[FLOAT_PROHIBITED] scrap_max_grams must be an integer',
                    })
                    .positive({
                        message:
                            '[OUT_OF_BOUNDS] scrap_max_grams must be positive',
                    })
                    .default(50),
                weight_max_grams: z
                    .number()
                    .int({
                        message:
                            '[FLOAT_PROHIBITED] weight_max_grams must be an integer',
                    })
                    .positive({
                        message:
                            '[OUT_OF_BOUNDS] weight_max_grams must be positive',
                    })
                    .default(5000),
                bulk_min_grams: z
                    .number()
                    .int({
                        message:
                            '[FLOAT_PROHIBITED] bulk_min_grams must be an integer',
                    })
                    .positive({
                        message:
                            '[OUT_OF_BOUNDS] bulk_min_grams must be positive',
                    })
                    .default(5001),
            })
            .strict(),
    })
    .strict()

export type StateSpace = z.infer<typeof StateSpaceSchema>

/**
 * Part 2: Bounded Action Vocabulary (A)
 * Restricts physical kinetic actions and social manipulation verbs to uppercase tokens.
 */
export const ActionVocabularySchema = z
    .object({
        permitted_kinetic_verbs: z
            .array(
                z.string().regex(/^[A-Z_]+$/, {
                    message:
                        '[INVALID_VERB_FORMAT] kinetic verbs must be uppercase alphanumeric tokens',
                }),
            )
            .min(1, {
                message:
                    '[EMPTY_ACTION_VOCABULARY] at least one kinetic verb is required',
            }),
        forbidden_verbs_global: z
            .array(
                z.string().regex(/^[a-z_]+$/, {
                    message:
                        '[INVALID_VERB_FORMAT] forbidden verbs must be lowercase tokens',
                }),
            )
            .default([]),
        locomotion_taxonomies: z.array(z.string().min(1)).min(1),
    })
    .strict()

export type ActionVocabulary = z.infer<typeof ActionVocabularySchema>

/**
 * Part 3: Invariant Engine (I)
 * Formalizes physical boundaries, Farce ratio caps, and acoustic damping floors.
 */
export const InvariantRulesSchema = z
    .object({
        max_farce_ratio_bp: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] max_farce_ratio_bp must be an integer',
            })
            .min(0, {
                message:
                    '[OUT_OF_BOUNDS] max_farce_ratio_bp cannot be negative',
            })
            .max(1500, {
                message:
                    '[OUT_OF_BOUNDS] max_farce_ratio_bp cannot exceed 1500 basis points',
            })
            .default(1500),
        min_grievance_depth_delta: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] min_grievance_depth_delta must be an integer',
            })
            .min(1, {
                message:
                    '[OUT_OF_BOUNDS] min_grievance_depth_delta must be at least 1',
            })
            .max(5, {
                message:
                    '[OUT_OF_BOUNDS] min_grievance_depth_delta cannot exceed 5',
            })
            .default(1),
        global_acoustic_floor_cdb: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] global_acoustic_floor_cdb must be an integer',
            })
            .min(0, {
                message:
                    '[OUT_OF_BOUNDS] global_acoustic_floor_cdb cannot be negative',
            })
            .max(10000, {
                message:
                    '[OUT_OF_BOUNDS] global_acoustic_floor_cdb cannot exceed 10000 cdB',
            })
            .default(1500),
        voiceover_ducking_db: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] voiceover_ducking_db must be an integer',
            })
            .max(0, {
                message:
                    '[OUT_OF_BOUNDS] voiceover_ducking_db must be non-positive decibels',
            })
            .default(-14),
        min_normalized_category_entropy_bp: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] min_normalized_category_entropy_bp must be an integer',
            })
            .min(0)
            .max(10000)
            .default(7000),
        thematic_categories: z.array(z.string().min(1)).length(7, {
            message:
                '[THEMATIC_CATEGORY_COUNT_MISMATCH] exactly 7 thematic categories required',
        }),
    })
    .strict()

export type InvariantRules = z.infer<typeof InvariantRulesSchema>

/**
 * Part 4: Medium Projections (R_m)
 * Bridges canonical narrative transitions to presentation parameters.
 */
export const MediumProjectionsSchema = z
    .object({
        target_fps: z.literal(24, {
            errorMap: () => ({
                message:
                    '[FPS_MISMATCH] master timeline projection strictly requires 24 fps',
            }),
            message:
                '[FPS_MISMATCH] master timeline projection strictly requires 24 fps',
        }),
        audio_sample_rate_hz: z.literal(48000, {
            errorMap: () => ({
                message:
                    '[SAMPLE_RATE_MISMATCH] master acoustic timeline strictly requires 48000 Hz',
            }),
            message:
                '[SAMPLE_RATE_MISMATCH] master acoustic timeline strictly requires 48000 Hz',
        }),
        tts_service_port: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] tts_service_port must be an integer',
            })
            .positive()
            .default(8000),
        video_service_port: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] video_service_port must be an integer',
            })
            .positive()
            .default(8188),
        aspect_ratio: z.enum(['16:9', '9:16', '1:1', '2.39:1']).default('16:9'),
    })
    .strict()

export type MediumProjections = z.infer<typeof MediumProjectionsSchema>

/**
 * Complete Universal Narrative Four-Tuple Series Configuration Schema.
 */
export const SeriesConfigSchema = z
    .object({
        schema_version: z.literal('1.0.0'),
        series_slug: z.string().regex(SeriesSlugRegex, {
            message:
                '[SERIES_SLUG_BREACH] series_slug must be a valid kebab-case slug',
        }),
        display_name: z.string().min(1, {
            message: '[EMPTY_DISPLAY_NAME] display_name cannot be empty',
        }),
        genre_tag: GenreModalityEnum,
        central_irony: z.string().min(10, {
            message:
                '[CENTRAL_IRONY_TOO_SHORT] central_irony must contain at least 10 characters',
        }),
        state_space: StateSpaceSchema,
        action_vocabulary: ActionVocabularySchema,
        invariant_rules: InvariantRulesSchema,
        medium_projections: MediumProjectionsSchema,
    })
    .strict()

export type SeriesConfig = z.infer<typeof SeriesConfigSchema>
