import { z } from 'zod'

export const CANONICAL_APHONIC_CONDITIONS = [
    'mute',
    'crushed_larynx',
    'severed_trachea',
    'aphonia',
    'vow_of_silence',
    'vocal_cord_paralysis',
    'traumatic_mutism',
    'cnd_vocal_cord_transected',
    'airway_blockage',
    'cnd_crushed_larynx',
] as const

export const BANNED_SPEAK_VERBS = [
    'speak',
    'vocalize',
    'yell',
    'shout',
    'whisper',
    'chant',
] as const

export const VocalFeasibilityCandidateSchema = z
    .object({
        entityId: z
            .string()
            .min(1)
            .regex(/^char_[a-z0-9_]+$/, 'INVALID_ENTITY_ID'),
        verbatimText: z
            .string()
            .regex(/^[\x00-\x7F]*$/, 'NON_ASCII_DIALOGUE_DETECTED')
            .default(''),
        activeConditions: z.array(z.string()).default([]),
        bannedKineticVerbs: z.array(z.string()).default([]),
        isNonVerbalExpression: z.boolean().default(false),
    })
    .strict()

export const VocalFeasibilityReceiptSchema = z
    .object({
        entityId: z.string(),
        isPhonationFeasible: z.boolean(),
        isAphonic: z.boolean(),
        matchedAphonicConditions: z.array(z.string()),
        matchedBannedVerbs: z.array(z.string()),
        hasVerbalDirectives: z.boolean(),
        status: z.enum(['VALID', 'BREACH']),
        reason: z.string().optional(),
        verifiedAtEpoch: z.number().int().nonnegative().default(0),
    })
    .strict()

export type VocalFeasibilityCandidate = z.infer<
    typeof VocalFeasibilityCandidateSchema
>
export type VocalFeasibilityReceipt = z.infer<
    typeof VocalFeasibilityReceiptSchema
>
