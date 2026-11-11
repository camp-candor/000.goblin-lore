import { z } from 'zod'

export const RuleCategoryEnum = z.enum([
    'PHYSICAL',
    'SOMATIC',
    'EPISTEMIC',
    'SOCIAL',
    'LOGISTICAL',
])
export type RuleCategory = z.infer<typeof RuleCategoryEnum>

export const RuleSeverityClassEnum = z.enum([
    'TIER_1_HARD_INVARIANT',
    'TIER_2_AUDITED_ONTOLOGY',
    'TIER_3_SOFT_STYLOMETRIC',
])
export type RuleSeverityClass = z.infer<typeof RuleSeverityClassEnum>

export const RuleSchema = z
    .object({
        id: z.string().regex(/^rule_[a-z0-9_]+$/, {
            message:
                '[RULE_SCHEMA_BREACH] id must match pattern ^rule_[a-z0-9_]+$',
        }),
        category: RuleCategoryEnum,
        severity_class: RuleSeverityClassEnum,
        description: z.string().min(10, {
            message:
                '[RULE_SCHEMA_BREACH] description must be at least 10 characters',
        }),
        pardonable: z.boolean().default(false),
        max_tolerated_pardon_frequency_bps: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] max_tolerated_pardon_frequency_bps must be an integer',
            })
            .min(0, { message: '[OUT_OF_BOUNDS] frequency cannot be negative' })
            .max(10000, {
                message:
                    '[OUT_OF_BOUNDS] frequency cannot exceed 10000 basis points',
            })
            .default(0),
        owning_entity_types: z
            .array(
                z.enum([
                    'character',
                    'location',
                    'possession',
                    'grievance',
                    'scene',
                ]),
            )
            .min(1, {
                message:
                    '[RULE_SCHEMA_BREACH] owning_entity_types must not be empty',
            }),
    })
    .strict()
    .refine(
        (rule) => {
            const isHardInvariant = [
                'PHYSICAL',
                'SOMATIC',
                'EPISTEMIC',
            ].includes(rule.category)
            if (isHardInvariant && rule.pardonable === true) {
                return false
            }
            return true
        },
        {
            message:
                '[UNPARDONABLE_INVARIANT_BREACH] PHYSICAL, SOMATIC, and EPISTEMIC rules must declare pardonable: false',
            path: ['pardonable'],
        },
    )

export type Rule = z.infer<typeof RuleSchema>

export const AuthorizerRoleEnum = z.enum([
    'LEAD_ARCHITECT',
    'SHOWRUNNER',
    'SCENE_DIRECTOR',
    'SYSTEM_ADMIN',
])
export type AuthorizerRole = z.infer<typeof AuthorizerRoleEnum>

export const AuthorizerSchema = z
    .object({
        id: z.string().regex(/^auth_[a-z0-9_]+$/, {
            message:
                '[AUTH_SCHEMA_BREACH] id must match pattern ^auth_[a-z0-9_]+$',
        }),
        name: z
            .string()
            .min(1, { message: '[AUTH_SCHEMA_BREACH] name is required' }),
        role: AuthorizerRoleEnum,
        permitted_categories: z.array(RuleCategoryEnum).min(1, {
            message:
                '[AUTH_SCHEMA_BREACH] permitted_categories must not be empty',
        }),
    })
    .strict()

export type Authorizer = z.infer<typeof AuthorizerSchema>
