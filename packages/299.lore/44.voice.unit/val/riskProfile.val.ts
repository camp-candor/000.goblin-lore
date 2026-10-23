import { z } from 'zod'

/**
 * Closed enumeration of canonical risk dispositions.
 */
export const RiskDispositionEnum = z.enum([
    'CAUTIOUS',
    'OPPORTUNISTIC',
    'RECKLESS',
    'PARANOID_FREEZE',
    'DEFENSIVE_STEWARD',
])

export type RiskDisposition = z.infer<typeof RiskDispositionEnum>

/**
 * Machine Rail frontmatter parameters for character risk mechanics.
 * Strictly integer basis points (0..10000) and raw aptitude (1..5).
 */
export const RiskProfileFrontmatterSchema = z
    .object({
        risk_aptitude: z.number().int().min(1).max(5),
        risk_availability_bias_bps: z.number().int().min(0).max(10000), // 0 to 10000 bps (0.00% to 100.00%)
        risk_trigger_keywords: z
            .array(
                z
                    .string()
                    .regex(
                        /^[a-z0-9_]+$/,
                        'Keywords must be lowercase alphanumeric ASCII',
                    ),
            )
            .min(1),
        shares_pose_with: z
            .string()
            .regex(/^[a-z0-9_]+$/)
            .nullable()
            .default(null),
    })
    .strict()

export type RiskProfileFrontmatter = z.infer<
    typeof RiskProfileFrontmatterSchema
>

/**
 * Voice Rail qualitative prose sections for character risk profile.
 */
export const RiskProfileSectionsSchema = z
    .object({
        disposition: z
            .string()
            .min(1, 'Disposition description cannot be empty'),
        trigger_condition: z
            .string()
            .min(1, 'Trigger condition cannot be empty'),
        risked_for: z.string().min(1, 'What they risk it for cannot be empty'),
        failure_behavior: z.string().min(1, 'Failure behavior cannot be empty'),
        success_behavior: z.string().min(1, 'Success behavior cannot be empty'),
    })
    .strict()

export type RiskProfileSections = z.infer<typeof RiskProfileSectionsSchema>

/**
 * Composite Character Risk Profile Contract.
 */
export const CharacterRiskProfileSchema = z
    .object({
        characterId: z.string().regex(/^char_[a-z0-9_]+$/),
        isExempt: z.boolean().default(false),
        exemptionReason: z.string().optional(),
        frontmatter: RiskProfileFrontmatterSchema.optional(),
        sections: RiskProfileSectionsSchema.optional(),
    })
    .strict()
    .superRefine((data, ctx) => {
        if (data.isExempt) {
            if (
                !data.exemptionReason ||
                data.exemptionReason.trim().length === 0
            ) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'EXEMPTION_REASON_MANDATORY: An exempt character must provide a non-empty exemptionReason',
                    path: ['exemptionReason'],
                })
            }
        } else {
            if (!data.frontmatter) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'MISSING_RISK_FRONTMATTER: Non-exempt character must declare risk_profile frontmatter',
                    path: ['frontmatter'],
                })
            }
            if (!data.sections) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message:
                        'MISSING_RISK_SECTIONS: Non-exempt character must declare risk_profile sections',
                    path: ['sections'],
                })
            }
        }
    })

export type CharacterRiskProfile = z.infer<typeof CharacterRiskProfileSchema>

/**
 * Verification receipt for risk profile auditing.
 */
export const RiskProfileValidationResultSchema = z
    .object({
        characterId: z.string().regex(/^char_[a-z0-9_]+$/),
        isValid: z.boolean(),
        isExempt: z.boolean(),
        errorCode: z.string().optional(),
        message: z.string().optional(),
        parsedProfile: CharacterRiskProfileSchema.optional(),
    })
    .strict()

export type RiskProfileValidationResult = z.infer<
    typeof RiskProfileValidationResultSchema
>
