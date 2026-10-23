import { z } from 'zod'

/**
 * 7-bit ASCII Slug Regular Expression for characters and entities.
 */
export const EntitySlugRegex = /^[a-z0-9_]+$/

/**
 * Tactical displacement behavioral mode enum.
 */
export const AttenuationBehaviorEnum = z.enum([
    'DIRECT_EXPRESSION_PERMITTED',
    'SUBTEXTUAL_DISPLACEMENT_MANDATED',
])
export type AttenuationBehavior = z.infer<typeof AttenuationBehaviorEnum>

/**
 * Clean 7-bit lowercase ASCII token schema.
 */
export const AttenuationLemmaSchema = z
    .string()
    .min(1, { message: 'Attenuation lemma cannot be empty' })
    .regex(/^[a-z0-9_-]+$/, {
        message: 'Attenuation lemma must be lowercase 7-bit ASCII',
    })

/**
 * Core schema for Subtext Attenuation Directives.
 */
export const AttenuationDirectiveSchema = z
    .object({
        directive_id: z.string().regex(/^att_[a-z0-9_]+$/),
        actor_id: z.string().regex(/^char_[a-z0-9_]+$/),
        suppression_factor_bps: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .default(7000),
        banned_tokens: z.array(AttenuationLemmaSchema).default([]),
        tactical_proxies: z.array(z.string().min(1)).default([]),
        behavioral_constraint: AttenuationBehaviorEnum.default(
            'SUBTEXTUAL_DISPLACEMENT_MANDATED',
        ),
    })
    .strict()
    .refine(
        (data) => {
            // If S >= 7,000 bps (0.70), banned_tokens must be non-empty and displacement mandated
            if (data.suppression_factor_bps >= 7000) {
                return (
                    data.banned_tokens.length > 0 &&
                    data.behavioral_constraint ===
                        'SUBTEXTUAL_DISPLACEMENT_MANDATED'
                )
            }
            return true
        },
        {
            message:
                'ATTENUATION_SCHEMA_BREACH: Suppression >= 7000 bps requires non-empty banned_tokens and SUBTEXTUAL_DISPLACEMENT_MANDATED',
            path: ['banned_tokens'],
        },
    )
export type AttenuationDirective = z.infer<typeof AttenuationDirectiveSchema>

/**
 * Input schema for linting a candidate dialogue line or Few-Shot text block.
 */
export const DialogueScanInputSchema = z
    .object({
        actor_id: z.string().regex(/^char_[a-z0-9_]+$/),
        dialogue_text: z.string().min(1),
        directive: AttenuationDirectiveSchema,
        is_break_state_authorized: z.boolean().default(false),
    })
    .strict()
export type DialogueScanInput = z.infer<typeof DialogueScanInputSchema>
