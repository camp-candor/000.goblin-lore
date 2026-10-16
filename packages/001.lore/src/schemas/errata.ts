import { z } from 'zod'

export const ErrataRecordSchema = z
    .object({
        errata_id: z
            .string()
            .regex(/^err_[a-z0-9_]+$/, 'ID must follow err_* format'),
        superseded_canon_sha: z
            .string()
            .length(64, 'Must be 64-char hex SHA-256'),
        active_canon_sha: z.string().length(64, 'Must be 64-char hex SHA-256'),
        affected_entity_ids: z.array(z.string().min(1)).min(1),
        affected_artifact_shas: z.array(z.string().length(64)).default([]),
        reason: z.string().min(5),
        authorized_by: z.string().min(1),
        timestamp_utc: z.string().datetime(),
        reanchoring_strategy: z.enum(['FREEZE_LEGACY', 'REMASTER_V2']),
    })
    .strict()

export type ErrataRecord = z.infer<typeof ErrataRecordSchema>

export const ErrataLedgerSchema = z
    .object({
        schema_version: z.literal('1.0.0'),
        records: z.array(ErrataRecordSchema),
    })
    .strict()

export type ErrataLedger = z.infer<typeof ErrataLedgerSchema>
