import { z } from 'zod'

export const SomaticMutationPayloadSchema = z
    .object({
        condition_added: z.string().min(1).optional(),
        temporary_motor_mask_relief: z.string().min(1).optional(),
        exhaustion_increment_bps: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] exhaustion_increment_bps must be integer',
            })
            .min(0)
            .max(10000)
            .optional(),
    })
    .strict()

export const LogisticalMutationPayloadSchema = z
    .object({
        capacity_override_grams: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] capacity_override_grams must be integer',
            })
            .min(0)
            .optional(),
        slot_borrow: z
            .object({
                source_slot: z.enum(['worn', 'held', 'carried', 'cached']),
                target_slot: z.enum(['worn', 'held', 'carried', 'cached']),
            })
            .strict()
            .optional(),
    })
    .strict()

export const SocialMutationPayloadSchema = z
    .object({
        temporary_leverage_delta_bps: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] temporary_leverage_delta_bps must be integer',
            })
            .optional(),
        deflection_target_override: z
            .string()
            .regex(/^char_[a-z0-9_]+$/)
            .optional(),
    })
    .strict()

export const InjectedStateMutationSchema = z.discriminatedUnion('vector', [
    z.object({
        vector: z.literal('somatic'),
        payload: SomaticMutationPayloadSchema,
    }),
    z.object({
        vector: z.literal('logistical'),
        payload: LogisticalMutationPayloadSchema,
    }),
    z.object({
        vector: z.literal('social'),
        payload: SocialMutationPayloadSchema,
    }),
])
export type InjectedStateMutation = z.infer<typeof InjectedStateMutationSchema>

export const PardonScopeSchema = z
    .object({
        series_slug: z.string().min(1),
        episode_id: z.string().min(1),
        scene_id: z.string().min(1),
        shot_id: z.string().optional(),
        entity_id: z.string().regex(/^char_[a-z0-9_]+$/, {
            message:
                '[PARDON_SCHEMA_BREACH] entity_id must match character identifier',
        }),
    })
    .strict()
export type PardonScope = z.infer<typeof PardonScopeSchema>

export const PardonRecordSchema = z
    .object({
        pardon_id: z.string().regex(/^pardon_[a-z0-9_]+$/, {
            message:
                '[PARDON_SCHEMA_BREACH] pardon_id must match pattern ^pardon_[a-z0-9_]+$',
        }),
        target: PardonScopeSchema,
        rule_id: z.string().regex(/^rule_[a-z0-9_]+$/, {
            message:
                '[PARDON_SCHEMA_BREACH] rule_id must match pattern ^rule_[a-z0-9_]+$',
        }),
        authorizer_id: z.string().regex(/^auth_[a-z0-9_]+$/, {
            message:
                '[PARDON_SCHEMA_BREACH] authorizer_id must match pattern ^auth_[a-z0-9_]+$',
        }),
        justification: z.string().min(20, {
            message:
                '[PARDON_JUSTIFICATION_TOO_SHORT] minimum 20 characters required for principled audit review',
        }),
        granted_against_canon_hash: z.string().regex(/^[0-9a-f]{64}$/, {
            message:
                '[INVALID_CANON_HASH] granted_against_canon_hash must be a 64-character lowercase SHA-256 hexadecimal string',
        }),
        injected_state_mutation: InjectedStateMutationSchema.optional(),
        granted_at_epoch: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] granted_at_epoch must be integer',
            })
            .nonnegative()
            .default(0),
    })
    .strict()

export type PardonRecord = z.infer<typeof PardonRecordSchema>
