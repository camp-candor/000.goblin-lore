import { z } from 'zod'
import { PURE_ASCII_REGEX } from './ttsPayload.val.js'

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

// Note that the PURE_ASCII_REGEX used in verbatimText doesn't allow empty strings by default if it requires 1 or more chars
// PURE_ASCII_REGEX is /^[\x20-\x7E\r\n\t]+$/
// For an empty string, the regex fails. So we need to handle empty string case separately.

export const VocalFeasibilityCandidateSchema = z
    .object({
        entityId: z
            .string()
            .min(1)
            .regex(/^char_[a-z0-9_]+$/, 'INVALID_ENTITY_ID'),
        verbatimText: z
            .string()
            .refine((val) => val === '' || PURE_ASCII_REGEX.test(val), {
                message: 'NON_ASCII_DIALOGUE_DETECTED',
            })
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
