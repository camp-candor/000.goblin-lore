import { z } from 'zod'

/**
 * 7-bit ASCII Slug Regular Expressions.
 */
export const CharacterSlugRegex = /^char_[a-z0-9_]+$/
export const FactSlugRegex = /^fact_[a-z0-9_]+$/
export const EventSlugRegex = /^evt_[a-z0-9_]+$/
export const BeliefSlugRegex = /^bel_[a-z0-9_]+$/

/**
 * Source provenance classification for character belief.
 */
export const BeliefSourceTypeEnum = z.enum([
    'DIRECT_OBSERVATION',
    'TESTIMONY',
    'INFERENCE',
    'RUMOR',
])
export type BeliefSourceType = z.infer<typeof BeliefSourceTypeEnum>

/**
 * Multi-valued Canonical World Truth Status domain.
 */
export const WorldFactStandingEnum = z.enum([
    'KNOWN_TRUE',
    'KNOWN_FALSE',
    'DISPUTED',
    'UNRESOLVED_BY_CANON',
])
export type WorldFactStanding = z.infer<typeof WorldFactStandingEnum>

/**
 * Structured semantic proposition tuple: <Subject, Predicate, Object>.
 */
export const SemanticPropositionTupleSchema = z
    .object({
        subject: z.string().min(1),
        predicate: z.string().min(1),
        object: z.string().min(1).optional(),
    })
    .strict()
export type SemanticPropositionTuple = z.infer<
    typeof SemanticPropositionTupleSchema
>

/**
 * Canonical BeliefRecord Schema.
 * Decouples subjective conviction from objective world reality.
 */
export const BeliefRecordSchema = z
    .object({
        belief_id: z.string().regex(BeliefSlugRegex, {
            message: 'Belief ID must match ^bel_[a-z0-9_]+$',
        }),
        holder_id: z.string().regex(CharacterSlugRegex, {
            message: 'Holder ID must match ^char_[a-z0-9_]+$',
        }),
        proposition_slug: z.string().regex(FactSlugRegex, {
            message: 'Proposition slug must match ^fact_[a-z0-9_]+$',
        }),
        proposition_tuple: SemanticPropositionTupleSchema,
        subjective_confidence_bps: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .default(10000),
        source_type: BeliefSourceTypeEnum.default('DIRECT_OBSERVATION'),
        source_event_id: z
            .string()
            .regex(EventSlugRegex)
            .default('evt_genesis_0000'),
        source_agent_id: z.string().regex(CharacterSlugRegex).optional(),
        parent_belief_id: z
            .string()
            .regex(BeliefSlugRegex)
            .nullable()
            .default(null),
        hop_count: z.number().int().nonnegative().default(0),
        resists_correction: z.boolean().default(false),
        recorded_at_epoch: z.number().int().nonnegative().default(0),
    })
    .strict()
    .refine(
        (data) => {
            // Testimony or rumor requires declaring who transmitted the claim
            if (
                (data.source_type === 'TESTIMONY' ||
                    data.source_type === 'RUMOR') &&
                !data.source_agent_id
            ) {
                return false
            }
            return true
        },
        {
            message:
                'TRANSMISSION_PROVENANCE_BREACH: TESTIMONY or RUMOR requires declaring source_agent_id',
            path: ['source_agent_id'],
        },
    )

export type BeliefRecord = z.infer<typeof BeliefRecordSchema>

/**
 * Divergence Evaluation Input Payload.
 */
export const EvaluateBeliefDivergenceInputSchema = z
    .object({
        belief: BeliefRecordSchema,
        canonical_standing: WorldFactStandingEnum,
        canonical_truth_value: z.boolean().nullable().default(null), // null for UNRESOLVED_BY_CANON
    })
    .strict()

export type EvaluateBeliefDivergenceInput = z.infer<
    typeof EvaluateBeliefDivergenceInputSchema
>
