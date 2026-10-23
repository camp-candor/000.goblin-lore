import { describe, it, expect } from 'vitest'
import {
    canonicalizeJson,
    sha256Hex,
    computeFactContentHash,
    createFactContentHashBit,
    verifyFactContentHashParity,
    assertFactContentHashParity,
} from '../buz/canonHash.buzz.js'
import { Sha256HashSchema } from '../val/canonHash.val.js'

describe('41.canon.unit: Unicode NFC Claim Content Hasher', () => {
    it('POSITIVE: Generates valid 64-character lowercase hex SHA-256 hash', () => {
        const hash = computeFactContentHash(
            'CHARACTER',
            'Bog right shoulder is dislocated.',
        )
        expect(hash).toMatch(/^[0-9a-f]{64}$/)
        expect(Sha256HashSchema.parse(hash)).toBe(hash)
    })

    it('POSITIVE: Enforces Unicode Normalization Form C (NFC) equivalence', () => {
        // Precomposed 'e' with acute: \u00E9
        const precomposedText = 'Caf\u00E9 door is locked.'
        // Decomposed 'e' + combining acute accent: e\u0301
        const decomposedText = 'Cafe\u0301 door is locked.'

        expect(precomposedText).not.toBe(decomposedText)
        expect(precomposedText.length).toBe(20)
        expect(decomposedText.length).toBe(21)

        const hashPrecomposed = computeFactContentHash(
            'LOCATION',
            precomposedText,
        )
        const hashDecomposed = computeFactContentHash(
            'LOCATION',
            decomposedText,
        )

        // NFC normalization must ensure bit-identical hashes
        expect(hashPrecomposed).toBe(hashDecomposed)
    })

    it('POSITIVE: Enforces RFC 8785 key order independence in canonicalizeJson', () => {
        const objA = { scope: 'LOGISTIC', claim: 'Iron wrench' }
        const objB = { claim: 'Iron wrench', scope: 'LOGISTIC' }

        const jsonA = canonicalizeJson(objA)
        const jsonB = canonicalizeJson(objB)

        expect(jsonA).toBe('{"claim":"Iron wrench","scope":"LOGISTIC"}')
        expect(jsonB).toBe('{"claim":"Iron wrench","scope":"LOGISTIC"}')
        expect(jsonA).toBe(jsonB)
        expect(sha256Hex(jsonA)).toBe(sha256Hex(jsonB))
    })

    it('POSITIVE: Creates FactContentHashBit with verified metadata', () => {
        const bit = createFactContentHashBit('LOGISTIC', 'Culvert siphon tube.')
        expect(bit.scope).toBe('LOGISTIC')
        expect(bit.normalizedClaim).toBe('Culvert siphon tube.')
        expect(bit.contentHash).toMatch(/^[0-9a-f]{64}$/)
        expect(bit.canonicalJson).toContain('"claim":"Culvert siphon tube."')
        expect(bit.canonicalJson).toContain('"scope":"LOGISTIC"')
    })

    it('POSITIVE: Confirms hash parity when hashes match', () => {
        const text = 'Wart clutches his wrench.'
        const expected = computeFactContentHash('CHARACTER', text)

        const result = verifyFactContentHashParity(expected, 'CHARACTER', text)
        expect(result.valid).toBe(true)
        if (result.valid) {
            expect(result.matchesExpected).toBe(true)
            expect(result.contentHash).toBe(expected)
        }

        expect(() =>
            assertFactContentHashParity(expected, 'CHARACTER', text),
        ).not.toThrow()
    })

    it('NEGATIVE CONTROL: Traps non-finite numbers in canonicalizeJson at T_0 ($0.00)', () => {
        expect(() => canonicalizeJson({ val: NaN })).toThrow(
            /Non-finite IEEE-754 numbers are strictly forbidden/,
        )
        expect(() => canonicalizeJson({ val: Infinity })).toThrow(
            /Non-finite IEEE-754 numbers are strictly forbidden/,
        )
        expect(() => canonicalizeJson({ val: -Infinity })).toThrow(
            /Non-finite IEEE-754 numbers are strictly forbidden/,
        )
    })

    it('NEGATIVE CONTROL: Traps hash parity mismatch at T_0 ($0.00)', () => {
        const text = 'Silas reaches for the valve.'
        const actualHash = computeFactContentHash('CHARACTER', text)
        const fakeHash =
            '0000000000000000000000000000000000000000000000000000000000000000'

        const result = verifyFactContentHashParity(fakeHash, 'CHARACTER', text)
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.errorCode).toBe('CONTENT_HASH_PARITY_MISMATCH')
            expect(result.expectedHash).toBe(fakeHash)
            expect(result.actualHash).toBe(actualHash)
            expect(result.message).toContain(
                'Cryptographic content hash mismatch',
            )
        }

        expect(() =>
            assertFactContentHashParity(fakeHash, 'CHARACTER', text),
        ).toThrow(/CONTENT_HASH_PARITY_BREACH/)
    })

    it('NEGATIVE CONTROL: Traps malformed expected hash strings at T_0 ($0.00)', () => {
        const malformed = [
            'short_hash',
            'UPPERCASE_HASH_01234567890123456789012345678901234567890123456789012345',
            '',
        ]
        for (const h of malformed) {
            const res = verifyFactContentHashParity(h, 'LAW', 'Universal truth')
            expect(res.valid).toBe(false)
            if (!res.valid) {
                expect(res.errorCode).toBe('INVALID_HASH_INPUT')
            }
        }
    })

    it('NEGATIVE CONTROL: Traps invalid scope in hash computation at T_0 ($0.00)', () => {
        expect(() =>
            computeFactContentHash('INVALID_SCOPE', 'Valid claim text.'),
        ).toThrow()
    })
})
