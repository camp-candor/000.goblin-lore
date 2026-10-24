import { z } from 'zod'

export const CANONICAL_GENRE_TAGS = [
    'LOW_FANTASY_FARCE',
    'SOUTHERN_GOTHIC_INDUSTRIAL',
    'HARD_SCIFI_VACUUM',
] as const

export const DEFAULT_THEMATIC_CATEGORIES = [
    'resource_hoarding',
    'status_anxiety',
    'secret_keeping',
    'generational_rift',
    'territorial_boundary',
    'loyalty_tests',
    'domestic_sabotage',
] as const

export const DEFAULT_PERMITTED_ACTIONS = [
    'LIMP',
    'CONCEAL',
    'EXPEND_LEVERAGE',
    'SIPHON',
    'DEFLECT',
] as const

export const StateSpaceSchema = z
    .object({
        scarcity_index_bps: z.number().int().min(0).max(10000),
        paranoia_baseline_bps: z.number().int().min(0).max(10000),
        scrap_max_grams: z.number().int().positive(),
        weight_max_grams: z.number().int().positive(),
    })
    .strict()

export const InvariantLawsSchema = z
    .object({
        max_farce_ratio_bps: z.number().int().min(0).max(1500),
        global_acoustic_floor_cdb: z.number().int().min(500).max(10000),
        vo_ducking_db: z.number().int().max(0),
        min_grievances_per_dyad: z.number().int().min(1),
        min_normalized_category_entropy_bps: z.number().int().min(0).max(10000),
        thematic_categories: z.array(z.string().min(1)).min(1),
    })
    .strict()

export const MediumProjectionsSchema = z
    .object({
        tts_port: z.number().int().min(1024).max(65535),
        comfy_port: z.number().int().min(1024).max(65535),
        lora_trigger_tokens: z.array(z.string().regex(/^[a-zA-Z0-9_\-]+$/)),
    })
    .strict()

export const SeriesConfigSchema = z
    .object({
        series_slug: z
            .string()
            .min(3)
            .max(64)
            .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
        display_name: z.string().min(1).max(128),
        genre_tag: z.enum(CANONICAL_GENRE_TAGS),
        central_irony: z.string().min(10).max(1024),
        state_space: StateSpaceSchema,
        action_vocabulary: z.array(z.string().regex(/^[A-Z0-9_]+$/)).min(1),
        invariants: InvariantLawsSchema,
        medium_projections: MediumProjectionsSchema,
    })
    .strict()

export type SeriesConfig = z.infer<typeof SeriesConfigSchema>
