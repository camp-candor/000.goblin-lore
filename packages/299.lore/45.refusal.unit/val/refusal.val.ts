import { z } from 'zod'

/**
 * 7-bit clean ASCII claim text schema.
 */
export const AsciiTextSchema = z
    .string()
    .min(1, 'Text cannot be empty')
    .regex(
        /^[\x20-\x7E\r\n\t]+$/,
        'Text must be strictly 7-bit printable ASCII',
    )

/**
 * Identifier schema for refusal vector rules.
 * e.g., "ref_never_explain_locks", "ref_deny_tallow_theft"
 */
export const RefusalIdSchema = z
    .string()
    .regex(
        /^ref_[a-z0-9_]{3,64}$/,
        'Refusal ID must start with ref_ followed by 3 to 64 lowercase alphanumeric/underscore characters',
    )

/**
 * Three-Stage Refusal Vector Rule Contract.
 * Codifies the immutable triad <Trigger, MandatoryRefusal, UnavoidableCost>,
 * paired with finite strain capacity and post-break behavioral state.
 */
export const RefusalVectorRuleSchema = z
    .object({
        refusal_id: RefusalIdSchema,
        character_id: z
            .string()
            .regex(
                /^char_[a-z0-9_]+$/,
                'Character ID must follow char_<slug> pattern',
            ),
        trigger: AsciiTextSchema,
        mandatory_refusal: AsciiTextSchema,
        unavoidable_cost: AsciiTextSchema,
        // prettier-ignore
        strain_threshold_bps: z.number().int().min(1000).max(10000).default(8000),
        post_break_state: AsciiTextSchema,
    })
    .strict()

export type RefusalVectorRule = z.infer<typeof RefusalVectorRuleSchema>

/**
 * Batch payload schema for validating multiple refusal vectors on a character.
 */
export const CharacterRefusalListSchema = z
    .object({
        character_id: z.string().regex(/^char_[a-z0-9_]+$/),
        refusals: z
            .array(RefusalVectorRuleSchema)
            .min(1, 'Character must declare at least one refusal vector rule'),
    })
    .strict()

export type CharacterRefusalList = z.infer<typeof CharacterRefusalListSchema>

/**
 * Verification receipt schema for refusal vector validation.
 */
export const RefusalValidationResultSchema = z
    .object({
        character_id: z.string().regex(/^char_[a-z0-9_]+$/),
        isValid: z.boolean(),
        refusalCount: z.number().int().nonnegative(),
        validatedRules: z.array(RefusalVectorRuleSchema).default([]),
        errorCode: z.string().optional(),
        message: z.string().optional(),
    })
    .strict()

export type RefusalValidationResult = z.infer<
    typeof RefusalValidationResultSchema
>
