import { z } from 'zod'

/**
 * 7-bit ASCII Slug Identifiers.
 */
export const CharacterSlugRegex = /^char_[a-z0-9_]+$/

/**
 * Conversational Escalation Ceiling Schema.
 * Constrained strictly to the integer interval [1, 5].
 */
export const EscalationCeilingSchema = z
    .number({
        required_error: 'Escalation ceiling is mandatory',
        invalid_type_error: 'Escalation ceiling must be an integer',
    })
    .int({ message: 'Escalation ceiling cannot be a float' })
    .min(1, { message: 'Escalation ceiling minimum is 1' })
    .max(5, { message: 'Escalation ceiling maximum is 5' })
    .default(3)

export type EscalationCeiling = z.infer<typeof EscalationCeilingSchema>

/**
 * Five-stat goblin personality baseline vector.
 * Every stat is an integer strictly bounded within [1, 5].
 */
export const BaseStatsSchema = z
    .object({
        spite: z.number().int().min(1).max(5).default(3),
        cunning: z.number().int().min(1).max(5).default(3),
        charm: z.number().int().min(1).max(5).default(3),
        nerve: z.number().int().min(1).max(5).default(3),
        warmth: z.number().int().min(1).max(5).default(3),
    })
    .strict()

export type BaseStats = z.infer<typeof BaseStatsSchema>

/**
 * Subtext Attenuation Token Array Schema.
 * Tokens that a character is psychologically barred from uttering in dialogue.
 */
export const AttenuationTokensSchema = z
    .array(z.string().min(1, { message: 'Attenuation token cannot be empty' }))
    .default([])

export type AttenuationTokens = z.infer<typeof AttenuationTokensSchema>

/**
 * Conversational Profile Schema for Character Dossier Frontmatter.
 */
export const CharacterConversationalProfileSchema = z
    .object({
        actor_id: z.string().regex(CharacterSlugRegex, {
            message: 'Actor ID must match ^char_[a-z0-9_]+$',
        }),
        escalation_ceiling: EscalationCeilingSchema,
        base_stats: BaseStatsSchema,
        attenuation_tokens: AttenuationTokensSchema,
        is_strained_break: z.boolean().default(false),
    })
    .strict()

export type CharacterConversationalProfile = z.infer<
    typeof CharacterConversationalProfileSchema
>

/**
 * Dialogue Turn Evaluation Input.
 * Evaluates whether an utterance or intended dramatic tier breaches character ceilings.
 */
export const DialogueTurnEvaluationInputSchema = z
    .object({
        actor_id: z.string().regex(CharacterSlugRegex),
        proposed_intensity_tier: z.number().int().min(1).max(5),
        spoken_dialogue_text: z.string().default(''),
        leverage_expended_count: z.number().int().nonnegative().default(0),
        override_authorized: z.boolean().default(false),
    })
    .strict()

export type DialogueTurnEvaluationInput = z.infer<
    typeof DialogueTurnEvaluationInputSchema
>

/**
 * Closed-world validation schema for namespaced child escalation pointers.
 */
export const SpawnEscalationTargetStringSchema = z
    .string()
    .regex(
        /^(grievance:grv_[a-z0-9_]+|secret:sec_[a-z0-9_]+)$/,
        'Target must match namespace format ^(grievance:grv_[a-z0-9_]+|secret:sec_[a-z0-9_]+)$',
    )

export type SpawnEscalationTargetString = z.infer<
    typeof SpawnEscalationTargetStringSchema
>
