import { z } from 'zod'
import { FactScopeEnum } from '../../38.types.unit/val/scope.val.js'

export const HEX_DIGEST_REGEX = /^[0-9a-f]{64}$/

/**
 * Zod schema validating a 64-character lowercase hexadecimal SHA-256 digest.
 */
export const Sha256HashSchema = z
    .string()
    .length(64, 'SHA-256 digest must be exactly 64 characters')
    .regex(
        HEX_DIGEST_REGEX,
        'SHA-256 digest must be lowercase hexadecimal characters only',
    )

export type Sha256Hash = z.infer<typeof Sha256HashSchema>

/**
 * Normalized Claim Payload Schema for RFC 8785 Canonical JSON Serialization.
 */
export const CanonicalClaimPayloadSchema = z
    .object({
        claim: z.string().min(1, 'Claim text must not be empty'),
        scope: FactScopeEnum,
    })
    .strict()

export type CanonicalClaimPayload = z.infer<typeof CanonicalClaimPayloadSchema>
