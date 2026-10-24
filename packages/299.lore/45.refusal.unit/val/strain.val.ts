import { z } from 'zod'

/**
 * 7-bit clean ASCII claim text schema.
 */
export const AsciiTextSchema = z
    .string()
    .min(1, 'Text cannot be empty')
    .regex(
        /^[\x20-\x7E\r\n\t]+$/,
        'Text must be strictly 7-bit printable ASCII',
    )

/**
 * Integer basis-point validator schema (0 to 10000 bps).
 * Disallows floats.
 */
export const BasisPointScalarSchema = z
    .number()
    .int('Basis points must be an integer')
    .min(0)
    .max(10000)

/**
 * Delta adjustment in basis points (-10000 to +10000 bps).
 */
export const BasisPointDeltaSchema = z
    .number()
    .int('Delta basis points must be an integer')
    .min(-10000, 'Delta cannot drop below -10000 bps')
    .max(10000, 'Delta cannot exceed +10000 bps')

/**
 * Payload contract for evaluating refusal strain transitions.
 */
export const RefusalStrainEvaluationPayloadSchema = z
    .object({
        character_id: z.string().regex(/^char_[a-z0-9_]+$/),
        refusal_id: z.string().regex(/^ref_[a-z0-9_]{3,64}$/),
        current_strain_bps: BasisPointScalarSchema,
        delta_strain_bps: BasisPointDeltaSchema,
        strain_threshold_bps: z
            .number()
            .int()
            .min(1000)
            .max(10000)
            .default(8000),
        post_break_state: AsciiTextSchema,
    })
    .strict()

export type RefusalStrainEvaluationPayload = z.infer<
    typeof RefusalStrainEvaluationPayloadSchema
>

/**
 * Receipt schema for refusal strain clamping and fracture evaluation.
 */
export const RefusalStrainReceiptSchema = z
    .object({
        character_id: z.string().regex(/^char_[a-z0-9_]+$/),
        refusal_id: z.string().regex(/^ref_[a-z0-9_]{3,64}$/),
        previous_strain_bps: BasisPointScalarSchema,
        delta_strain_bps: BasisPointDeltaSchema,
        clamped_strain_bps: BasisPointScalarSchema,
        strain_threshold_bps: z.number().int().min(1000).max(10000),
        threshold_breached: z.boolean(),
        active_state: z.string(),
        is_fractured: z.boolean(),
        isValid: z.boolean(),
        errorCode: z.string().optional(),
        message: z.string().optional(),
    })
    .strict()

export type RefusalStrainReceipt = z.infer<typeof RefusalStrainReceiptSchema>

/**
 * Pure integer clamping function for basis-point arithmetic.
 */
export function clampBasisPoints(currentBps: number, deltaBps: number): number {
    if (!Number.isInteger(currentBps) || !Number.isInteger(deltaBps)) {
        throw new Error(
            'FLOAT_PROHIBITED_BREACH: Basis points and deltas must be pure integers.',
        )
    }
    const sum = currentBps + deltaBps
    if (sum < 0) return 0
    if (sum > 10000) return 10000
    return sum
}
