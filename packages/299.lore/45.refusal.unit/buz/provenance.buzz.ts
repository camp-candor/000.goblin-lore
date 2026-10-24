import { createHash } from 'node:crypto'
import { RefusalModel } from '../refusal.model'
import type RefusalBit from '../fce/refusal.bit'
import type State from '../../99.core/state'
import {
    BindDiscoveryProvenancePayloadSchema,
    type DiscoveryProvenanceReceipt,
    type BindDiscoveryProvenancePayload,
} from '../val/provenance.val'

/**
 * Computes a deterministic 64-character lowercase hexadecimal SHA-256 hash
 * over normalized 7-bit ASCII text.
 */
export function computeExcerptSha256(text: string): string {
    const normalized = text.trim()
    return createHash('sha256').update(normalized, 'ascii').digest('hex')
}

/**
 * Verifies excerpt parity against an existing expected SHA-256 digest.
 */
export function verifyExcerptParity(
    text: string,
    expectedHash: string,
): boolean {
    const actualHash = computeExcerptSha256(text)
    return actualHash === expectedHash.toLowerCase()
}

/**
 * Cryptographically binds a winning Step 0 discovery excerpt to a character refusal rule.
 */
export const bindDiscoveryProvenance = (
    cpy: RefusalModel,
    bal: RefusalBit,
    ste: State,
): RefusalModel => {
    const characterId = String(
        bal.idx ?? bal.dat?.character_id ?? 'char_unknown',
    )
    const payload = bal.dat ?? {}

    const parseResult = BindDiscoveryProvenancePayloadSchema.safeParse({
        character_id: characterId,
        ...payload,
    })

    if (!parseResult.success) {
        const issue = parseResult.error.issues[0]
        const failure: DiscoveryProvenanceReceipt = {
            character_id: characterId,
            refusal_id: String(payload.refusal_id ?? 'ref_unknown'),
            take_id: 'TAKE_A',
            discovery_provenance_sha256:
                '0000000000000000000000000000000000000000000000000000000000000000',
            excerpt_byte_length: 0,
            isValid: false,
            errorCode: 'INVALID_PROVENANCE_PAYLOAD_BREACH',
            message: `${issue?.path.join('.')}: ${issue?.message}`,
        }

        if (bal.slv != null) {
            bal.slv({
                rflBit: {
                    idx: 'bind-discovery-provenance',
                    val: 0,
                    dat: failure,
                },
            })
        }
        return cpy
    }

    const validData: BindDiscoveryProvenancePayload = parseResult.data
    const hashDigest = computeExcerptSha256(validData.excerpt_text_ascii)
    const byteLength = Buffer.byteLength(
        validData.excerpt_text_ascii.trim(),
        'ascii',
    )

    // Verify parity if an expected hash was supplied in bal.src
    if (bal.src && bal.src.length === 64) {
        if (bal.src.toLowerCase() !== hashDigest) {
            const parityFailure: DiscoveryProvenanceReceipt = {
                character_id: validData.character_id,
                refusal_id: validData.refusal_id,
                take_id: validData.take_id,
                discovery_provenance_sha256: hashDigest,
                source_note_id: validData.source_note_id,
                excerpt_byte_length: byteLength,
                isValid: false,
                errorCode: 'PROVENANCE_HASH_PARITY_BREACH',
                message: `Expected hash '${bal.src}' does not match computed excerpt digest '${hashDigest}'.`,
            }

            if (bal.slv != null) {
                bal.slv({
                    rflBit: {
                        idx: 'bind-discovery-provenance',
                        val: 0,
                        dat: parityFailure,
                    },
                })
            }
            return cpy
        }
    }

    const receipt: DiscoveryProvenanceReceipt = {
        character_id: validData.character_id,
        refusal_id: validData.refusal_id,
        take_id: validData.take_id,
        discovery_provenance_sha256: hashDigest,
        source_note_id: validData.source_note_id,
        excerpt_byte_length: byteLength,
        isValid: true,
        message: `Discovery excerpt for '${validData.refusal_id}' bound to ${validData.take_id} [${hashDigest.slice(0, 12)}...].`,
    }

    if (bal.slv != null) {
        bal.slv({
            rflBit: {
                idx: 'bind-discovery-provenance',
                val: 1,
                dat: receipt,
            },
        })
    }

    return cpy
}
