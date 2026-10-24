import { z } from 'zod'

/**
 * Gillian Arithmetic Doctrine: Fixed-point integer basis points (0..10000).
 * Rejects floating-point fractions at compile time T_0 = $0.00.
 */
export const BasisPointSchema = z
    .number({
        required_error: 'Basis point value is required',
        invalid_type_error: 'Basis point value must be an integer',
    })
    .int('Basis point value must be a pure integer')
    .min(0, 'Basis point scalar floor is 0 bp')
    .max(10000, 'Basis point scalar ceiling is 10000 bp')

export type BasisPoint = z.infer<typeof BasisPointSchema>

/**
 * Discrete scale step bounds for narrative duels and grievances (1..5).
 */
export const ScaleStepSchema = z
    .number({
        required_error: 'Scale step value is required',
        invalid_type_error: 'Scale step value must be an integer',
    })
    .int('Scale step value must be a pure integer')
    .min(1, 'Scale step minimum is 1')
    .max(5, 'Scale step maximum is 5')

export type ScaleStep = z.infer<typeof ScaleStepSchema>

/**
 * Closed-world validation contract for threshold audits.
 */
export const ThresholdAuditPayloadSchema = z
    .object({
        basis_point_value: BasisPointSchema,
        escalation_ceiling: ScaleStepSchema,
        intensity_score: ScaleStepSchema,
    })
    .strict()

export type ThresholdAuditPayload = z.infer<typeof ThresholdAuditPayloadSchema>
