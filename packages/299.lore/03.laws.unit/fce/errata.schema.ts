import { z } from 'zod'

export const ErrataClassificationEnum = z.enum([
    'FACTUAL_CONTRADICTION',
    'CHRONOLOGICAL_SLIP',
    'ANATOMICAL_ANOMALY',
    'ORTHOGRAPHIC_CANONIZATION',
    'HISTORICAL_RETCON',
])
export type ErrataClassification = z.infer<typeof ErrataClassificationEnum>

export const ErrataRecordSchema = z
    .object({
        errata_id: z.string().regex(/^err_[a-z0-9_]+$/, {
            message:
                '[ERRATA_SCHEMA_BREACH] errata_id must match pattern ^err_[a-z0-9_]+$',
        }),
        sequence_number: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] sequence_number must be an integer',
            })
            .min(1, {
                message: '[OUT_OF_BOUNDS] sequence_number must be >= 1',
            }),
        classification: ErrataClassificationEnum,
        superseded_merkle_hash: z.string().regex(/^[0-9a-f]{64}$/, {
            message:
                '[INVALID_HASH] superseded_merkle_hash must be a 64-character lowercase hexadecimal SHA-256 string',
        }),
        active_merkle_hash: z.string().regex(/^[0-9a-f]{64}$/, {
            message:
                '[INVALID_HASH] active_merkle_hash must be a 64-character lowercase hexadecimal SHA-256 string',
        }),
        superseded_commit_sha: z.string().regex(/^[0-9a-f]{40}$/, {
            message:
                '[INVALID_COMMIT_SHA] superseded_commit_sha must be a 40-character hexadecimal Git SHA',
        }),
        active_commit_sha: z.string().regex(/^[0-9a-f]{40}$/, {
            message:
                '[INVALID_COMMIT_SHA] active_commit_sha must be a 40-character hexadecimal Git SHA',
        }),
        affected_entity_ids: z.array(z.string().min(1)).min(1, {
            message:
                '[ERRATA_EMPTY_TARGETS] at least one affected entity required',
        }),
        historical_episodes: z.array(z.string().min(1)).default([]),
        rationale: z.string().min(20, {
            message:
                '[RATIONALE_TOO_SHORT] rationale must contain at least 20 characters',
        }),
        recorded_at_epoch: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] recorded_at_epoch must be an integer',
            })
            .nonnegative({
                message: '[OUT_OF_BOUNDS] recorded_at_epoch cannot be negative',
            }),
    })
    .strict()

export type ErrataRecord = z.infer<typeof ErrataRecordSchema>

export const ErrataLedgerFileSchema = z
    .object({
        schema_version: z.literal('1.0.0'),
        series_slug: z.string().min(1),
        genesis_merkle_hash: z.string().regex(/^[0-9a-f]{64}$/),
        records: z.array(ErrataRecordSchema),
    })
    .strict()

export type ErrataLedgerFile = z.infer<typeof ErrataLedgerFileSchema>
