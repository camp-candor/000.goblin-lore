import { z } from 'zod'

/**
 * 64-character lowercase hexadecimal SHA-256 digest schema.
 */
export const Sha256HashSchema = z
    .string()
    .regex(
        /^[0-9a-f]{64}$/,
        'Hash must be a 64-character lowercase hexadecimal SHA-256 string',
    )

/**
 * Enumeration of allowable creative discovery takes from Step 0 divergence.
 */
export const DiscoveryTakeIdEnum = z.enum([
    'TAKE_A',
    'TAKE_B',
    'TAKE_C',
    'TAKE_D',
])

export type DiscoveryTakeId = z.infer<typeof DiscoveryTakeIdEnum>

/**
 * Payload contract for binding a winning discovery excerpt to a refusal rule.
 */
export const BindDiscoveryProvenancePayloadSchema = z
    .object({
        character_id: z.string().regex(/^char_[a-z0-9_]+$/),
        refusal_id: z.string().regex(/^ref_[a-z0-9_]{3,64}$/),
        take_id: DiscoveryTakeIdEnum,
        excerpt_text_ascii: z
            .string()
            .min(10, 'Discovery excerpt must be at least 10 characters')
            .regex(
                /^[\x20-\x7E\r\n\t]+$/,
                'Excerpt must be strictly 7-bit printable ASCII',
            ),
        source_note_id: z
            .string()
            .regex(
                /^[a-z0-9_]{3,64}$/,
                'Source note ID must be lowercase alphanumeric ASCII',
            )
            .optional(),
    })
    .strict()

export type BindDiscoveryProvenancePayload = z.infer<
    typeof BindDiscoveryProvenancePayloadSchema
>

/**
 * Receipt emitted after binding discovery excerpt provenance.
 */
export const DiscoveryProvenanceReceiptSchema = z
    .object({
        character_id: z.string().regex(/^char_[a-z0-9_]+$/),
        refusal_id: z.string().regex(/^ref_[a-z0-9_]{3,64}$/),
        take_id: DiscoveryTakeIdEnum,
        discovery_provenance_sha256: Sha256HashSchema,
        source_note_id: z.string().optional(),
        excerpt_byte_length: z.number().int().nonnegative(),
        isValid: z.boolean(),
        errorCode: z.string().optional(),
        message: z.string().optional(),
    })
    .strict()

export type DiscoveryProvenanceReceipt = z.infer<
    typeof DiscoveryProvenanceReceiptSchema
>
