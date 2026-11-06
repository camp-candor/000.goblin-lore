import { z } from 'zod'
import { FACT_SLUG_REGEX } from './ttsPayload.val.js'

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

export const PinnedFactEntrySchema = z
    .object({
        factId: z.string().regex(FACT_SLUG_REGEX, 'INVALID_FACT_ID_FORMAT'),
        pinnedVersion: z
            .number()
            .int()
            .min(1, 'PINNED_VERSION_MUST_BE_AT_LEAST_1'),
        pinnedHash: z.string().regex(/^[0-9a-f]{64}$/, 'INVALID_SHA256_HASH'),
        claimText: z.string().min(1, 'CLAIM_TEXT_CANNOT_BE_EMPTY'),
        scope: z
            .enum(['CHARACTER', 'LOCATION', 'LOGISTIC', 'LAW'])
            .default('CHARACTER'),
    })
    .strict()

export const LiveFactStateSchema = z
    .object({
        factId: z.string().regex(FACT_SLUG_REGEX),
        currentVersion: z.number().int().min(1),
        contentHash: z.string().regex(/^[0-9a-f]{64}$/),
        claimText: z.string().min(1),
        isRetired: z.boolean().default(false),
    })
    .strict()

export const StalenessEvaluationInputSchema = z
    .object({
        sceneId: z
            .string()
            .min(1)
            .regex(/^sc_[a-z0-9_]+$/),
        pinnedFacts: z
            .array(PinnedFactEntrySchema)
            .min(1, 'PINNED_FACTS_CANNOT_BE_EMPTY'),
        liveLedgerFacts: z.record(z.string(), LiveFactStateSchema),
    })
    .strict()

export const FactDiffItemSchema = z
    .object({
        factId: z.string(),
        pinnedVersion: z.number().int(),
        liveVersion: z.number().int(),
        pinnedClaimText: z.string(),
        liveClaimText: z.string(),
        invalidationReason: z.string(),
        isRetired: z.boolean(),
    })
    .strict()

export const StalenessEvaluationReceiptSchema = z
    .object({
        sceneId: z.string(),
        isDirty: z.boolean(),
        staleFactCount: z.number().int().nonnegative(),
        diffs: z.array(FactDiffItemSchema),
        status: z.enum(['CLEAN', 'DIRTY_PENDING_REVALIDATION']),
        evaluatedAtEpoch: z.number().int().nonnegative().default(0),
    })
    .strict()

export type PinnedFactEntry = z.infer<typeof PinnedFactEntrySchema>
export type LiveFactState = z.infer<typeof LiveFactStateSchema>
export type StalenessEvaluationInput = z.infer<
    typeof StalenessEvaluationInputSchema
>
export type FactDiffItem = z.infer<typeof FactDiffItemSchema>
export type StalenessEvaluationReceipt = z.infer<
    typeof StalenessEvaluationReceiptSchema
>
