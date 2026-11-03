import { z } from 'zod'
import { BannedCadenceEnum } from '../../37.trauma.unit/val/vocalDsp.val.js'

export const ConditionSlugRegex = /^cnd_[a-z0-9_]+$/

export function assertIntegerMetric(
    value: unknown,
    fieldName: string,
): asserts value is number {
    if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
        throw new Error(
            `[FLOAT_PROHIBITED] ${fieldName} must be a safe integer primitive. Received: ${value}`,
        )
    }
}

export const ConditionRegistryEntrySchema = z
    .object({
        condition_slug: z
            .string()
            .regex(
                ConditionSlugRegex,
                'Condition slug must match ^cnd_[a-z0-9_]+$',
            ),
        title: z.string().min(1, 'Condition title cannot be empty'),
        arm_penalty_bps: z.number().int().min(0).max(10000).default(0),
        velocity_penalty_bps: z.number().int().min(0).max(10000).default(0),
        chronic_fatigue_floor_bps: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .default(0),
        chronic_pain_floor_bps: z.number().int().min(0).max(10000).default(0),
        chronic_refusal_strain_floor_bps: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .default(0),
        chronic_paranoia_floor_bps: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .default(0),
        auditory_debuff_cdb: z.number().int().min(0).max(10000).default(0),
        banned_verbs: z.array(z.string().min(1)).default([]),
        dsp_deltas: z
            .object({
                pitch_shift_centitones: z
                    .number()
                    .int()
                    .min(-1200)
                    .max(1200)
                    .default(0),
                formant_warping_bps: z
                    .number()
                    .int()
                    .min(5000)
                    .max(20000)
                    .default(10000),
                vocal_fry_density_bps: z
                    .number()
                    .int()
                    .min(0)
                    .max(10000)
                    .default(0),
                breathiness_pause_bps: z
                    .number()
                    .int()
                    .min(10000)
                    .max(35000)
                    .default(10000),
                banned_cadences: z.array(BannedCadenceEnum).default([]),
            })
            .default({
                pitch_shift_centitones: 0,
                formant_warping_bps: 10000,
                vocal_fry_density_bps: 0,
                breathiness_pause_bps: 10000,
                banned_cadences: [],
            }),
    })
    .strict()

export const WorldConditionsFrontmatterSchema = z
    .object({
        id: z.string().default('world_conditions_registry'),
        type: z.literal('conditions_catalog'),
        version: z.number().int().positive().default(1),
        conditions: z.array(ConditionRegistryEntrySchema),
    })
    .strict()

export type ConditionRegistryEntry = z.infer<
    typeof ConditionRegistryEntrySchema
>
export type WorldConditionsFrontmatter = z.infer<
    typeof WorldConditionsFrontmatterSchema
>
