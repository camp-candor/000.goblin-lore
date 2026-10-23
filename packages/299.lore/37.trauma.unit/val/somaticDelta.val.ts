import { z } from 'zod'
import { SensoryAcuityProfileSchema } from './sensory.val'
import { VocalDspModifierProfileSchema } from './vocalDsp.val'
import {
    LocomotionBaselineEnum,
    LimbClampingReceiptSchema,
} from '../../40.wound.unit/val/wound.val'

export const LocomotionTierEnum = z.enum([
    'UNRESTRICTED',
    'LIMPING',
    'IMMOBILIZED',
])
export type LocomotionTier = z.infer<typeof LocomotionTierEnum>

export const SomaticDeltaInputSchema = z
    .object({
        entityId: z.string().regex(/^char_[a-z0-9_]+$/),
        conditionsAdded: z.array(z.string()).default([]),
        conditionsRemoved: z.array(z.string()).default([]),
        deltaFatigueBps: z.number().int().min(-10000).max(10000).default(0),
        deltaPainBps: z.number().int().min(-10000).max(10000).default(0),
        deltaRefusalStrainBps: z
            .number()
            .int()
            .min(-10000)
            .max(10000)
            .default(0),
        deltaLegs: z.number().int().min(-2).max(2).default(0),
        motorLimitationsAdded: z.array(z.string()).default([]),
        motorLimitationsRemoved: z.array(z.string()).default([]),
        signatureTicsAdded: z.array(z.string()).default([]),
        signatureTicsRemoved: z.array(z.string()).default([]),
        locomotionBaseline: LocomotionBaselineEnum.default('bipedal_standard'),
        tick: z.number().int().nonnegative().default(0),
    })
    .strict()

export type SomaticDeltaInput = z.infer<typeof SomaticDeltaInputSchema>

export const SomaticTraumaReceiptSchema = z
    .object({
        entityId: z.string().regex(/^char_[a-z0-9_]+$/),
        armsAvailable: z.number().int().min(0).max(2),
        availableArmsBps: z.number().int().min(0).max(20000),
        legsAvailable: z.number().int().min(0).max(2),
        locomotionTier: LocomotionTierEnum,
        fatigueBps: z.number().int().min(0).max(10000),
        painBps: z.number().int().min(0).max(10000),
        refusalStrainBps: z.number().int().min(0).max(10000),
        isRefusalStrained: z.boolean(),
        activeConditions: z.array(z.string()),
        motorLimitations: z.array(z.string()),
        signatureTics: z.array(z.string()),
        limbReceipt: LimbClampingReceiptSchema,
        sensoryProfile: SensoryAcuityProfileSchema,
        vocalDspProfile: VocalDspModifierProfileSchema,
        updatedAtTick: z.number().int().nonnegative(),
    })
    .strict()

export type SomaticTraumaReceipt = z.infer<typeof SomaticTraumaReceiptSchema>
