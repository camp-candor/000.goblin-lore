import { z } from 'zod'
import {
    GenreClassificationEnum,
    type GenreClassification,
} from '../../38.types.unit/val/genre.val.js'

export { GenreClassificationEnum }
export type { GenreClassification }

export const SeriesConfigSchema = z
    .object({
        $schema: z.string().optional(),
        schema_version: z.literal('1.0.0'),
        series_slug: z.string().regex(/^[a-z0-9-]+$/),
        display_name: z.string().min(1),
        genre_tag: GenreClassificationEnum,
        central_irony: z.string().min(1),
        state_space: z
            .object({
                scarcity_index_bps: z.number().int().min(0).max(10000),
                paranoia_baseline_bps: z.number().int().min(0).max(10000),
                somatic_fatigue_enabled: z.boolean(),
                epistemic_ignorance_enabled: z.boolean(),
                gram_mass_tiers: z
                    .object({
                        scrap_max_grams: z.number().int().positive(),
                        weight_max_grams: z.number().int().positive(),
                        bulk_min_grams: z.number().int().positive(),
                    })
                    .strict(),
            })
            .strict(),
        action_vocabulary: z
            .object({
                permitted_kinetic_verbs: z.array(z.string().min(1)).min(1),
                forbidden_verbs_global: z.array(z.string().min(1)),
                locomotion_taxonomies: z.array(z.string().min(1)).min(1),
            })
            .strict(),
        invariant_rules: z
            .object({
                max_farce_ratio_bps: z.number().int().min(0).max(10000),
                min_grievance_depth_delta: z.number().int().min(1),
                global_acoustic_floor_cdb: z.number().int().min(0),
                voiceover_ducking_db: z.number().int().max(0),
                min_normalized_category_entropy_bps: z
                    .number()
                    .int()
                    .min(0)
                    .max(10000),
                thematic_categories: z.array(z.string().min(1)).min(1),
            })
            .strict(),
        medium_projections: z
            .object({
                target_fps: z.literal(24),
                audio_sample_rate_hz: z.literal(48000),
                tts_service_port: z.number().int().positive(),
                video_service_port: z.number().int().positive(),
                aspect_ratio: z.literal('16:9'),
            })
            .strict(),
    })
    .strict()

export type SeriesConfig = z.infer<typeof SeriesConfigSchema>
export default interface Series {
    idx: string
}
