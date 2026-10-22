import { z } from 'zod'

export const MIN_EPOCH_INTEGER = 0
export const MAX_SAFE_EPOCH_INTEGER = Number.MAX_SAFE_INTEGER // 9007199254740991

/**
 * Zod refinement predicate ensuring strict non-negative safe integers.
 * Rejects floats, negatives, NaN, and Infinity.
 */
export const isNonNegativeSafeInteger = (val: number): boolean => {
    return (
        typeof val === 'number' &&
        Number.isSafeInteger(val) &&
        val >= MIN_EPOCH_INTEGER
    )
}

/**
 * Base Zod Schema enforcing strict non-negative safe integer epochs.
 */
export const EpochIntegerSchema = z
    .number({
        required_error: 'Epoch integer is required',
        invalid_type_error: 'Epoch must be a number primitive',
    })
    .refine((val) => !Number.isNaN(val), {
        message: 'NaN is strictly forbidden as an epoch value',
    })
    .refine((val) => Number.isFinite(val), {
        message: 'Non-finite values (Infinity) are strictly forbidden',
    })
    .refine((val) => Number.isInteger(val), {
        message:
            'Floating-point values are strictly forbidden; epoch must be an exact integer',
    })
    .refine((val) => val >= MIN_EPOCH_INTEGER, {
        message: `Epoch must be a non-negative integer (>= ${MIN_EPOCH_INTEGER})`,
    })
    .refine((val) => val <= MAX_SAFE_EPOCH_INTEGER, {
        message: `Epoch exceeds maximum safe integer bound (${MAX_SAFE_EPOCH_INTEGER})`,
    })

export type EpochInteger = z.infer<typeof EpochIntegerSchema>

/**
 * Fact Node Temporal Epoch Triad Schema:
 * Enforces discrete integer epochs with deterministic default initializers of 0.
 * BANS runtime wall-clock default initializers.
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
