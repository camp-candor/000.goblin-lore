import { z } from 'zod'

/**
 * Conditions and traits that trigger absolute vocal aphonia (can_speak === false).
 */
export const APHONIC_CONDITIONS = [
    'MUTE',
    'CRUSHED_LARYNX',
    'SEVERED_TRACHEA',
    'APHONIA',
    'VOW_OF_SILENCE',
    'VOCAL_CORD_PARALYSIS',
    'TRAUMATIC_MUTISM',
] as const

export const SpokenDialogueSpanSchema = z
    .object({
        rawText: z.string(),
        lineNumber: z.number().int().positive().optional(),
        isQuoted: z.boolean(),
    })
    .strict()

export type SpokenDialogueSpan = z.infer<typeof SpokenDialogueSpanSchema>

export const MuteInvarianceQuerySchema = z
    .object({
        entityId: z.string().min(1),
        canSpeak: z.boolean(),
        activeConditions: z.array(z.string()).default([]),
        voiceRailFewShotLines: z.array(z.string()).default([]),
        candidateDialogueBlocks: z.array(z.string()).default([]),
    })
    .strict()

export type MuteInvarianceQuery = z.infer<typeof MuteInvarianceQuerySchema>

export const MuteInvarianceReceiptSchema = z
    .object({
        allowed: z.boolean(),
        entityId: z.string(),
        canSpeak: z.boolean(),
        breachCount: z.number().int().nonnegative(),
        breaches: z.array(SpokenDialogueSpanSchema),
        remediationDirective: z.string().nullable(),
        timestampEpochMs: z.number().int().nonnegative(),
    })
    .strict()

export type MuteInvarianceReceipt = z.infer<typeof MuteInvarianceReceiptSchema>
