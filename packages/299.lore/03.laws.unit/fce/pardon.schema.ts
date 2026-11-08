import { z } from 'zod'

export const PardonScopeSchema = z
    .object({
        episode_id: z.string().min(1),
        scene_id: z.string().min(1),
        shot_id: z.string().min(1),
        entity_id: z.string().regex(/^char_[a-z0-9_]+$/, {
            message:
                '[PARDON_SCHEMA_BREACH] entity_id must match character identifier',
        }),
    })
    .strict()

export type PardonScope = z.infer<typeof PardonScopeSchema>

export const PardonRecordSchema = z
    .object({
        id: z.string().regex(/^pardon_[a-z0-9_]+$/, {
            message:
                '[PARDON_SCHEMA_BREACH] id must match pattern ^pardon_[a-z0-9_]+$',
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
                '[PARDON_JUSTIFICATION_TOO_SHORT] minimum 20 characters required',
        }),
        granted_against_canon_hash: z.string().length(64, {
            message:
                '[INVALID_CANON_HASH] granted_against_canon_hash must be 64-character SHA-256 hex',
        }),
        status: z.enum(['ACTIVE', 'EXPIRED', 'REVOKED']).default('ACTIVE'),
    })
    .strict()

export type PardonRecord = z.infer<typeof PardonRecordSchema>
