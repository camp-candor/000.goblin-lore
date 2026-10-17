import { z } from 'zod'

export const ErrataSeverityEnum = z.enum([
    'COSMETIC',
    'SUBTEXTUAL',
    'CANONICAL_BREACH',
    'FATAL_RETCON',
])

export type ErrataSeverity = z.infer<typeof ErrataSeverityEnum>

export const ErrataRecordSchema = z
    .object({
        id: z.string().regex(/^errata_[a-z0-9_]+$/),
        superseded_canon_sha: z.string().length(64),
        active_canon_sha: z.string().length(64),
        affected_entity_ids: z.array(z.string().min(1)).min(1),
        severity: ErrataSeverityEnum,
        defect_description: z.string().min(1),
        corrective_action: z.string().min(1),
        reported_by: z.string().min(1),
        created_at_epoch: z.number().int().min(0),
    })
    .strict()

export type ErrataRecord = z.infer<typeof ErrataRecordSchema>

export const ErrataLedgerSchema = z
    .object({
        version: z.number().int().default(1),
        records: z.array(ErrataRecordSchema).default([]),
    })
    .strict()

export type ErrataLedger = z.infer<typeof ErrataLedgerSchema>

export type MediaProvenanceKind = 'REPLAY' | 'REMASTER'

/**
 * Classifies historical media provenance without rewriting manifests:
 * identical canon SHAs are an original Replay, differing SHAs are a Remaster.
 */
export function classifyMediaProvenance(
    supersededCanonSha: string,
    activeCanonSha: string,
): MediaProvenanceKind {
    return supersededCanonSha === activeCanonSha ? 'REPLAY' : 'REMASTER'
}
