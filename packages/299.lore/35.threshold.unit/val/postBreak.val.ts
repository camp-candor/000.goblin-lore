import { z } from 'zod'

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

export const PermanentAcousticDeltasSchema = z
    .object({
        basePitchShiftCentitones: z
            .number()
            .int()
            .min(-1200)
            .max(1200)
            .default(0),
        formantWarpingBps: z.number().int().min(5000).max(20000).default(10000),
        vocalFryDensityBps: z.number().int().min(0).max(10000).default(0),
        breathinessPauseMultiplierBps: z
            .number()
            .int()
            .min(10000)
            .max(35000)
            .default(10000),
        bannedCadencesRemoved: z.array(z.string().min(1)).default([]),
    })
    .strict()

export const PostBreakMutationDirectiveSchema = z
    .object({
        entityId: z.string().regex(/^char_[a-z0-9_]+$/),
        targetRefusalVectorId: z.string().regex(/^ref_[a-z0-9_]+$/),
        newBehaviorDirective: z.string().min(1),
        bannedTokensRemoved: z.array(z.string().min(1)).default([]),
        terminalConditionAdded: z.enum([
            'PARALYZED',
            'SUBSERVIENT',
            'MANIC_RAGE',
            'CATATONIC_STUPOR',
            'MUTED_TRAUMA',
        ]),
        permanentAcousticDeltas: PermanentAcousticDeltasSchema.default({
            basePitchShiftCentitones: 0,
            formantWarpingBps: 10000,
            vocalFryDensityBps: 0,
            breathinessPauseMultiplierBps: 10000,
            bannedCadencesRemoved: [],
        }),
        climaxSceneDirective: z.string().min(1),
    })
    .strict()

export const ThresholdEvaluationInputSchema = z
    .object({
        meterId: z.string().regex(/^mtr_[a-z0-9_]+$/),
        entityId: z.string().regex(/^char_[a-z0-9_]+$/),
        category: z.enum([
            'SOMATIC_FATIGUE',
            'PHYSICAL_PAIN',
            'REFUSAL_STRAIN',
            'PARANOIA_CLOCK',
        ]),
        currentValueBp: z.number().int().min(0).max(10000),
        thresholdLimitBp: z.number().int().min(0).max(10000),
        mutationDirective: PostBreakMutationDirectiveSchema,
        tick: z.number().int().nonnegative().default(0),
    })
    .strict()

export const PostBreakReceiptSchema = z
    .object({
        entityId: z.string(),
        meterId: z.string(),
        category: z.string(),
        breachedValueBp: z.number().int().min(0).max(10000),
        thresholdLimitBp: z.number().int().min(0).max(10000),
        targetRefusalVectorId: z.string(),
        terminalConditionAdded: z.string(),
        bannedTokensRemoved: z.array(z.string()),
        updatedAcousticProfile: z.object({
            pitchShiftCentitones: z.number().int().min(-1200).max(1200),
            formantWarpingBps: z.number().int().min(5000).max(20000),
            vocalFryDensityBps: z.number().int().min(0).max(10000),
            breathinessPauseMultiplierBps: z
                .number()
                .int()
                .min(10000)
                .max(35000),
            remainingBannedCadences: z.array(z.string()),
        }),
        climaxSceneDirective: z.string(),
        isHaltRequired: z.boolean(),
        updatedAtTick: z.number().int().nonnegative(),
    })
    .strict()

export type PermanentAcousticDeltas = z.infer<
    typeof PermanentAcousticDeltasSchema
>
export type PostBreakMutationDirective = z.infer<
    typeof PostBreakMutationDirectiveSchema
>
export type ThresholdEvaluationInput = z.infer<
    typeof ThresholdEvaluationInputSchema
>
export type PostBreakReceipt = z.infer<typeof PostBreakReceiptSchema>
