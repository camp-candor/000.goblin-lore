import { z } from 'zod'

export const BASIS_POINTS_MAX = 10000
export const BASIS_POINTS_MIN = 0

export const BasisPointSchema = z
    .number({
        required_error:
            '[BASIS_POINTS_REQUIRED] Basis points value is mandatory',
        invalid_type_error:
            '[FLOAT_PROHIBITED] Basis points must be a pure integer number',
    })
    .int({
        message:
            '[FLOAT_PROHIBITED] Basis points must be an integer (no decimals permitted)',
    })
    .min(BASIS_POINTS_MIN, {
        message: '[OUT_OF_BOUNDS] Basis points cannot be negative (< 0)',
    })
    .max(BASIS_POINTS_MAX, {
        message: '[OUT_OF_BOUNDS] Basis points cannot exceed 10,000 (1.0)',
    })

export type BasisPoints = z.infer<typeof BasisPointSchema>

export interface BasisPointMetricBit {
    readonly raw_value: number
    readonly basis_points: BasisPoints
    readonly normalized_ratio: number
}

export function sanitizeBasisPoints(value: number): BasisPoints {
    if (!Number.isInteger(value)) {
        throw new TypeError(
            `[FLOAT_PROHIBITED] Non-integer basis points provided: ${value}`,
        )
    }
    if (value < BASIS_POINTS_MIN || value > BASIS_POINTS_MAX) {
        throw new RangeError(
            `[OUT_OF_BOUNDS] Value ${value} lies outside [0, 10000] basis-point range.`,
        )
    }
    return value as BasisPoints
}
