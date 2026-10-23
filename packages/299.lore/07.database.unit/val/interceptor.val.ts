import { z } from 'zod'
import { FactScopeEnum } from '../../38.types.unit/val/scope.val.js'
import { AuthorityLevelEnum } from '../../38.types.unit/val/authority.val.js'
import { TriStateStandingEnum } from '../../38.types.unit/val/standing.val.js'
import { VersionIntegerSchema } from '../../28.sequence.unit/val/sequence.val.js'

export const PreWriteErrorCodeEnum = z.enum([
    'PRE_WRITE_SCOPE_VIOLATION',
    'PRE_WRITE_AUTHORITY_VIOLATION',
    'PRE_WRITE_AUTHORITY_DEMOTION',
    'PRE_WRITE_STANDING_VIOLATION',
    'PRE_WRITE_VERSION_REGRESSION',
    'PRE_WRITE_SEQUENCE_GAP',
    'PRE_WRITE_SILENT_MUTATION',
    'PRE_WRITE_HASH_MISMATCH',
    'PRE_WRITE_PREFIX_MISMATCH',
    'PRE_WRITE_MALFORMED_PAYLOAD',
])

export type PreWriteErrorCode = z.infer<typeof PreWriteErrorCodeEnum>

/**
 * Zod schema for fact record pre-write candidate validation.
 */
export const PreWriteFactCandidateSchema = z
    .object({
        id: z.string().min(1, 'Fact ID must not be empty'),
        claim_text: z.string().min(1, 'Claim text must not be empty'),
        scope: FactScopeEnum,
        authority_level: AuthorityLevelEnum.default('CANON'),
        standing: TriStateStandingEnum.default('ACTIVE_ENDORSED'),
        version: VersionIntegerSchema.default(1),
        content_hash: z.string().min(1, 'Content hash must not be empty'),
        author: z.string().min(1, 'Author must not be empty'),
        created_at_ms: z.number().int().min(0),
        last_edited_at_ms: z.number().int().min(0),
    })
    .strict()

export type PreWriteFactCandidate = z.infer<typeof PreWriteFactCandidateSchema>

/**
 * Zod schema for scene dependency pre-write candidate validation.
 */
export const PreWriteDependencyCandidateSchema = z
    .object({
        scene_id: z.string().min(1),
        fact_id: z.string().min(1),
        entity_type: z.enum([
            'character',
            'location',
            'possession',
            'grievance',
            'axiom',
        ]),
        pinned_version: VersionIntegerSchema,
        created_at_ms: z.number().int().min(0),
    })
    .strict()

export type PreWriteDependencyCandidate = z.infer<
    typeof PreWriteDependencyCandidateSchema
>
