import { z } from 'zod'

export const SEVERE_ARM_CONDITIONS_LIST = [
    'braxial_plexus_severed',
    'severed_right_arm',
    'severed_left_arm',
    'paralyzed_arm',
    'amputated_limb',
] as const

export const SevereArmConditionEnum = z.enum(SEVERE_ARM_CONDITIONS_LIST)

export const LocomotionBaselineEnum = z.enum([
    'bipedal_standard',
    'bipedal_hunched',
    'quadrupedal',
    'slithering',
    'brachiation',
    'sessile',
    'limping',
    'heavy_grounded_slog',
])

export type LocomotionBaseline = z.infer<typeof LocomotionBaselineEnum>

export const CompoundTraumaInputSchema = z
    .object({
        entityId: z.string().regex(/^char_[a-z0-9_]+$/),
        locomotionBaseline: LocomotionBaselineEnum.default('bipedal_standard'),
        conditions: z.array(z.string()).default([]),
        baseArmsBps: z.number().int().min(0).max(20000).optional(),
    })
    .strict()

export type CompoundTraumaInput = z.infer<typeof CompoundTraumaInputSchema>

export const LimbClampingReceiptSchema = z
    .object({
        entityId: z.string(),
        locomotionBaseline: LocomotionBaselineEnum,
        baseArmsBps: z.number().int().min(0).max(20000),
        penaltiesAppliedCount: z.number().int().nonnegative(),
        totalPenaltyBps: z.number().int().nonnegative(),
        rawCalculatedBps: z.number().int(),
        availableArmsBps: z.number().int().min(0).max(20000),
        armsAvailable: z.number().int().min(0).max(2),
        isClampedAtZero: z.boolean(),
        matchedSevereConditions: z.array(z.string()),
    })
    .strict()

export type LimbClampingReceipt = z.infer<typeof LimbClampingReceiptSchema>
