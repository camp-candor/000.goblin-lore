import { z } from 'zod'

export const ByteZeroErrorCodeEnum = z.enum([
    'UTF8_BOM_DETECTED',
    'LEADING_WHITESPACE_DETECTED',
    'CARRIAGE_RETURN_NON_POSIX',
    'MISSING_BYTE_ZERO_DELIMITER',
    'DELIMITER_NOT_FOLLOWED_BY_LF',
    'MISSING_CLOSING_DELIMITER',
    'PAYLOAD_TOO_SHORT',
    'MALFORMED_YAML_PAYLOAD',
    'SCHEMA_VALIDATION_FAILURE',
])

export type ByteZeroErrorCode = z.infer<typeof ByteZeroErrorCodeEnum>

/**
 * Zod schema validating a verified Byte-0 inspection envelope.
 */
export const ByteZeroEnvelopeSchema = z
    .object({
        valid: z.boolean(),
        byteOffset: z.number().int().min(0),
        hasBom: z.boolean(),
        hasCarriageReturns: z.boolean(),
        errorCode: ByteZeroErrorCodeEnum.optional(),
        message: z.string().optional(),
    })
    .strict()

export type ByteZeroEnvelope = z.infer<typeof ByteZeroEnvelopeSchema>
