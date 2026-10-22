import { z } from 'zod'

/**
 * Positive Safe Integer Version Schema.
 * Narrative fact versions must be positive integers starting at 1.
 * Floating-point numbers, zero, and negative values are strictly prohibited.
 */
export const VersionIntegerSchema = z
    .number()
    .int('Version must be an integer')
    .min(1, 'Version must be at least 1')
    .max(Number.MAX_SAFE_INTEGER, 'Version exceeds maximum safe integer')

export type VersionInteger = z.infer<typeof VersionIntegerSchema>

/**
 * Pure type-guard checking whether an arbitrary value is a valid VersionInteger.
 */
export function isValidVersionInteger(value: unknown): value is VersionInteger {
    return (
        typeof value === 'number' &&
        Number.isInteger(value) &&
        value >= 1 &&
        value <= Number.MAX_SAFE_INTEGER
    )
}

/**
 * Synchronously validates whether a candidate is a valid VersionInteger.
 * Throws ZodError if invalid.
 */
export function validateVersionInteger(rawVersion: unknown): VersionInteger {
    return VersionIntegerSchema.parse(rawVersion)
}
