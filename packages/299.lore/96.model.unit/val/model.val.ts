import { z } from 'zod'
import { FactScopeEnum } from '../../38.types.unit/val/scope.val.js'
import { AuthorityLevelEnum } from '../../38.types.unit/val/authority.val.js'
import { TriStateStandingEnum } from '../../38.types.unit/val/standing.val.js'
import { VersionIntegerSchema } from '../../28.sequence.unit/val/sequence.val.js'
import { Sha256HashSchema } from '../../41.canon.unit/val/canonHash.val.js'

export const RegistryErrorCodeEnum = z.enum([
    'FACT_ALREADY_REGISTERED',
    'FACT_NOT_FOUND',
    'SCHEMA_VALIDATION_ERROR',
    'IMMUTABILITY_BREACH_DETECTED',
    'INVALID_QUERY_PARAMETER',
])

export type RegistryErrorCode = z.infer<typeof RegistryErrorCodeEnum>

/**
 * Zod schema validating a stored FactNodeBit entity.
 */
export const StoredFactNodeSchema = z
    .object({
        id: z.string().min(1, 'Fact ID must not be empty'),
        claim_text: z.string().min(1, 'Claim text must not be empty'),
        scope: FactScopeEnum,
        authority_level: AuthorityLevelEnum,
        standing: TriStateStandingEnum,
        version: VersionIntegerSchema,
        content_hash: Sha256HashSchema,
        author: z.string().min(1, 'Author must not be empty'),
        created_at_ms: z.number().int().min(0),
        last_edited_at_ms: z.number().int().min(0),
    })
    .strict()

export type StoredFactNode = z.infer<typeof StoredFactNodeSchema>
