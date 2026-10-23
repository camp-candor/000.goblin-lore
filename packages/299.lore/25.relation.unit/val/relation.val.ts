import { z } from 'zod'

/**
 * 7-bit ASCII Slug Regular Expressions.
 */
export const CharacterSlugRegex = /^char_[a-z0-9_]+$/

/**
 * Canonical dyadic attitude taxonomy.
 * Replaces vague emotional adjectives with structural conversational stances.
 */
export const DyadicAttitudeEnum = z.enum([
    'HOSTILE_SUSPICION',
    'GRUDGING_COOPERATION',
    'DISMISSIVE_SUPERIORITY',
    'FEARFUL_COMPLIANCE',
    'PROTECTIVE_DEFLECTION',
    'TRANSACTIONAL_CONTEMPT',
    'COLD_INDIFFERENCE',
])
export type DyadicAttitude = z.infer<typeof DyadicAttitudeEnum>

/**
 * Redirection rule for conversational conflict deflection.
 * When pressed on a sensitive topic, the character deflects toward a specific sideways topic or third party.
 */
export const EnsembleRedirectionRuleSchema = z
    .object({
        rule_id: z.string().regex(/^red_[a-z0-9_]+$/),
        actor_id: z.string().regex(CharacterSlugRegex),
        partner_id: z.string().regex(CharacterSlugRegex),
        trigger_keyword: z.string().min(1),
        conflict_deflection_target: z
            .string()
            .regex(CharacterSlugRegex)
            .nullable()
            .default(null),
        sideways_topic_ascii: z.string().min(1),
        deflection_bias_bps: z.number().int().min(0).max(10000).default(8000),
    })
    .strict()
    .refine((data) => data.actor_id !== data.partner_id, {
        message:
            'ANTI_REFLEXIVITY_RELATION_BREACH: actor_id cannot be identical to partner_id',
        path: ['partner_id'],
    })
export type EnsembleRedirectionRule = z.infer<
    typeof EnsembleRedirectionRuleSchema
>

/**
 * Frontmatter contract for Character Relationship Defaults.
 */
export const RelationshipDefaultsSchema = z
    .record(
        z.string().regex(CharacterSlugRegex, {
            message: 'Partner ID must match ^char_[a-z0-9_]+$',
        }),
        DyadicAttitudeEnum,
    )
    .default({})
export type RelationshipDefaults = z.infer<typeof RelationshipDefaultsSchema>

/**
 * Composite Character Relational Profile.
 */
export const CharacterRelationProfileSchema = z
    .object({
        actor_id: z.string().regex(CharacterSlugRegex),
        relationship_defaults: RelationshipDefaultsSchema,
        redirection_rules: z.array(EnsembleRedirectionRuleSchema).default([]),
    })
    .strict()
    .refine(
        (data) =>
            !Object.keys(data.relationship_defaults).includes(data.actor_id),
        {
            message:
                'ANTI_REFLEXIVITY_RELATION_BREACH: Character cannot declare relationship attitude toward self',
            path: ['relationship_defaults'],
        },
    )
export type CharacterRelationProfile = z.infer<
    typeof CharacterRelationProfileSchema
>

/**
 * Input schema for compiling the downstream epistemic context prompt slice.
 */
export const BuildEpistemicPromptInputSchema = z
    .object({
        actor_id: z.string().regex(CharacterSlugRegex),
        interlocutor_id: z.string().regex(CharacterSlugRegex),
        profile: CharacterRelationProfileSchema,
        known_propositions: z
            .array(
                z
                    .object({
                        slug: z.string().min(1),
                        claim_ascii: z.string().min(1),
                        standing_tier: z.enum([
                            'TOTAL_IGNORANCE',
                            'RUMOR_ONLY',
                            'FALSE_BELIEF',
                            'PARTIAL_FACT',
                            'WITHHELD',
                            'FACTUAL_WITNESS',
                        ]),
                    })
                    .strict(),
            )
            .default([]),
        leverage_held_over_partner: z.number().int().nonnegative().default(0),
    })
    .strict()
    .refine((data) => data.actor_id !== data.interlocutor_id, {
        message:
            'ANTI_REFLEXIVITY_RELATION_BREACH: Cannot assemble epistemic dialogue prompt against self',
        path: ['interlocutor_id'],
    })
export type BuildEpistemicPromptInput = z.infer<
    typeof BuildEpistemicPromptInputSchema
>
