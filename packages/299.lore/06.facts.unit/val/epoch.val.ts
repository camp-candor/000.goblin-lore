import { z } from 'zod'

export const MIN_EPOCH_INTEGER = 0
export const MAX_SAFE_EPOCH_INTEGER = Number.MAX_SAFE_INTEGER

/**
 * Pure predicate checking whether a candidate value is a non-negative safe integer.
 */
export function isNonNegativeSafeInteger(val: unknown): val is number {
    return (
        typeof val === 'number' &&
        Number.isInteger(val) &&
        val >= MIN_EPOCH_INTEGER &&
        val <= MAX_SAFE_EPOCH_INTEGER
    )
}

/**
 * Zod schema enforcing integer time tokens.
 */
export const EpochIntegerSchema = z
    .number({
        required_error: 'Epoch integer is required',
        invalid_type_error: 'Epoch must be a number primitive',
    })
    .int('Epoch must be an exact integer; floating-point timestamps prohibited')
    .min(
        MIN_EPOCH_INTEGER,
        'Epoch must be non-negative (>= 0); negative epochs prohibited',
    )
    .max(
        MAX_SAFE_EPOCH_INTEGER,
        'Epoch exceeds JavaScript MAX_SAFE_INTEGER bounds',
    )

export type EpochInteger = z.infer<typeof EpochIntegerSchema>

/**
 * Zod schema enforcing the complete 3-epoch temporal triad of a canonical Fact Node.
 */
export const FactEpochTriadSchema = z
    .object({
        created_at_epoch: EpochIntegerSchema.default(0),
        last_mutated_epoch: EpochIntegerSchema.default(0),
        last_reconsidered_epoch: EpochIntegerSchema.default(0),
    })
    .strict()
    .refine((data) => data.created_at_epoch <= data.last_mutated_epoch, {
        message:
            'Temporal sequence invariant breach: created_at_epoch must be <= last_mutated_epoch',
        path: ['last_mutated_epoch'],
    })

export type FactEpochTriad = z.infer<typeof FactEpochTriadSchema>
