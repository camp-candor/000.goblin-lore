import { z } from 'zod'

export const BANNED_CADENCE_ENUM = [
    'RAPID_STACCATO',
    'RISING_INFLECTION_INTERROGATIVE',
    'CHEERFUL_MODULATION',
    'UPBEAT_LILT',
    'SING_SONG_RESONANCE',
] as const

export const BannedCadenceEnum = z.enum(BANNED_CADENCE_ENUM)
export type BannedCadence = z.infer<typeof BannedCadenceEnum>

export const LARYNGEAL_TRAUMA_CONDITIONS = [
    'crushed_larynx',
    'blunt_neck_trauma',
    'vocal_cord_scarring',
    'tracheal_contusion',
] as const

export const PULMONARY_TRAUMA_CONDITIONS = [
    'pulmonary_fibrosis',
    'gas_inhalation_damage',
    'chronic_diaphragmatic_exhaustion',
    'chemical_burn_respiratory',
] as const

export const HYPOTHERMIA_SHOCK_CONDITIONS = [
    'severe_hypothermia',
    'physiological_shock',
    'acute_tremor_chill',
] as const

export const NEUROPATHY_SPINAL_CONDITIONS = [
    'spinal_compression_tremors',
    'peripheral_neuropathy_vocal',
    'exhausted_chest_drone',
] as const

export const VocalDspModifierInputSchema = z
    .object({
        entityId: z.string().regex(/^char_[a-z0-9_]+$/),
        conditions: z.array(z.string()).default([]),
        explicitPitchShiftCentitones: z
            .number()
            .int()
            .min(-1200)
            .max(1200)
            .optional(),
        explicitFormantWarpingBps: z
            .number()
            .int()
            .min(5000)
            .max(20000)
            .optional(),
        explicitSpeedMultiplierBps: z
            .number()
            .int()
            .min(1000)
            .max(30000)
            .optional(),
        explicitBreathinessPauseBps: z
            .number()
            .int()
            .min(10000)
            .max(35000)
            .optional(),
        explicitVocalFryDensityBps: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .optional(),
        explicitBannedCadences: z.array(BannedCadenceEnum).optional(),
    })
    .strict()

export type VocalDspModifierInput = z.infer<typeof VocalDspModifierInputSchema>

export const VocalDspModifierProfileSchema = z
    .object({
        entityId: z.string().regex(/^char_[a-z0-9_]+$/),
        pitchShiftCentitones: z.number().int().min(-1200).max(1200),
        formantWarpingBps: z.number().int().min(5000).max(20000),
        speedMultiplierBps: z.number().int().min(1000).max(30000),
        breathinessPauseMultiplierBps: z.number().int().min(10000).max(35000),
        vocalFryDensityBps: z.number().int().min(0).max(10000),
        hasLaryngealTrauma: z.boolean(),
        hasPulmonaryTrauma: z.boolean(),
        bannedCadences: z.array(BannedCadenceEnum),
        matchedAcousticConditions: z.array(z.string()),
    })
    .strict()
    .superRefine((val, ctx) => {
        if (val.hasLaryngealTrauma && val.formantWarpingBps > 9000) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[VOCAL_DSP_SCHEMA_BREACH] Laryngeal trauma mandates pharyngeal compression (formantWarpingBps <= 9000)',
                path: ['formantWarpingBps'],
            })
        }
        if (
            val.hasPulmonaryTrauma &&
            val.breathinessPauseMultiplierBps < 12000
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[VOCAL_DSP_SCHEMA_BREACH] Pulmonary trauma mandates breath dilation (breathinessPauseMultiplierBps >= 12000)',
                path: ['breathinessPauseMultiplierBps'],
            })
        }
    })

export type VocalDspModifierProfile = z.infer<
    typeof VocalDspModifierProfileSchema
>
