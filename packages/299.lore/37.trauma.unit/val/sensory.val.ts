import { z } from 'zod'

export const OPTICAL_STATE_ENUM = ['NORMAL', 'MONOCULAR', 'BLIND'] as const
export const OpticalStateEnum = z.enum(OPTICAL_STATE_ENUM)
export type OpticalState = z.infer<typeof OpticalStateEnum>

export const OCULAR_CONDITIONS_CATALOG = {
    blind: [
        'blind_both_eyes',
        'bilateral_enucleation',
        'total_optical_severance',
    ],
    monocular: [
        'corneal_scarring',
        'enucleation_left_eye',
        'enucleation_right_eye',
        'cataract_left_eye',
        'cataract_right_eye',
        'monocular_vision',
        'ocular_puncture_left',
        'ocular_puncture_right',
    ],
} as const

export const ACOUSTIC_TRAUMA_CONDITIONS = [
    'concussive_hearing_loss',
    'ruptured_eardrum',
    'acoustic_trauma',
    'tinnitus_severe',
    'blast_injury_tympanic',
] as const

export const SensoryAcuityInputSchema = z
    .object({
        entityId: z.string().regex(/^char_[a-z0-9_]+$/),
        conditions: z.array(z.string()).default([]),
        explicitOpticalState: OpticalStateEnum.optional(),
        explicitBlindConeDegrees: z.number().int().min(0).max(360).optional(),
        explicitVisualAcuityBps: z.number().int().min(0).max(10000).optional(),
        explicitAuditoryDebuffCdB: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .optional(),
    })
    .strict()

export type SensoryAcuityInput = z.infer<typeof SensoryAcuityInputSchema>

export const SensoryAcuityProfileSchema = z
    .object({
        entityId: z.string().regex(/^char_[a-z0-9_]+$/),
        opticalState: OpticalStateEnum,
        blindConeDegrees: z.number().int().min(0).max(360),
        visualAcuityBps: z.number().int().min(0).max(10000),
        auditoryFloorDebuffCdB: z.number().int().min(0).max(10000),
        hasAcousticTrauma: z.boolean(),
        matchedOcularConditions: z.array(z.string()),
        matchedAcousticConditions: z.array(z.string()),
    })
    .strict()
    .superRefine((val, ctx) => {
        if (val.opticalState === 'MONOCULAR' && val.blindConeDegrees < 60) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[SENSORY_SCHEMA_BREACH] Monocular vision requires blindConeDegrees >= 60',
                path: ['blindConeDegrees'],
            })
        }
        if (
            val.opticalState === 'BLIND' &&
            (val.visualAcuityBps !== 0 || val.blindConeDegrees !== 360)
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message:
                    '[SENSORY_SCHEMA_BREACH] Blind vision requires visualAcuityBps = 0 and blindConeDegrees = 360',
                path: ['visualAcuityBps'],
            })
        }
    })

export type SensoryAcuityProfile = z.infer<typeof SensoryAcuityProfileSchema>
