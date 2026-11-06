import { z } from 'zod'

export const GauntletTrapIdEnum = z.enum([
    'TRAP_1_FLOAT_METRIC_PROHIBITED',
    'TRAP_2_UNSCHEMAED_KEY_CLOSURE',
    'TRAP_3_APHONIC_DELIVERY_BREACH',
    'TRAP_4_MONOTONIC_VERSION_REGRESSION',
    'TRAP_5_RFC8785_HASH_PARITY_BREACH',
])
export type GauntletTrapId = z.infer<typeof GauntletTrapIdEnum>

export const GauntletTrapResultSchema = z
    .object({
        trapId: GauntletTrapIdEnum,
        stageName: z.string().min(1),
        targetUnit: z.string().min(1),
        passed: z.boolean(),
        caughtExceptionSignature: z.string().min(1),
        executionLatencyMs: z.number().nonnegative(),
        diagnosticTrace: z.string().min(1),
    })
    .strict()

export const SomaticGauntletSummarySchema = z
    .object({
        suiteId: z.string().min(1),
        totalTraps: z.number().int().positive(),
        trapsPassed: z.number().int().nonnegative(),
        isCertified: z.boolean(),
        totalExecutionDurationMs: z.number().nonnegative(),
        results: z.array(GauntletTrapResultSchema),
        evaluatedAtEpoch: z.number().int().nonnegative().default(0),
    })
    .strict()

export type GauntletTrapResult = z.infer<typeof GauntletTrapResultSchema>
export type SomaticGauntletSummary = z.infer<
    typeof SomaticGauntletSummarySchema
>
