import { describe, it, expect } from 'vitest'
import { AsciiGuardBuzz } from '../buz/asciiGuard.buzz.js'
import {
    ASCII_LF,
    ASCII_PRINTABLE_MIN,
    ASCII_PRINTABLE_MAX,
    UTF8_BOM_CHAR_CODE,
    CLAIM_TEXT_MIN_LENGTH,
    CLAIM_TEXT_MAX_LENGTH,
    ClaimTextAsciiSchema,
} from '../val/ascii.val.js'

describe('06.facts.unit :: Seven-Bit ASCII Claim Text Sanitizer', () => {
    describe('Positive Controls (7-Bit ASCII Compliance)', () => {
        const validClaims = [
            'Bog right shoulder is dislocated.',
            'Valve 04 in culvert is seized shut.\nInspection recommended.',
            'Episode 09 narrative branch points initialized.',
            'Axiom 101: Mass and energy are conserved across all simulation ticks.',
        ]

        it.each(validClaims)(
            'accepts canonical clean 7-bit ASCII text: "%s"',
            (text) => {
                expect(() => ClaimTextAsciiSchema.parse(text)).not.toThrow()
                const res = AsciiGuardBuzz.validateClaimText(text)
                expect(res.isValid).toBe(true)
                if (res.isValid) {
                    expect(res.sanitizedText).toBe(text)
                    expect(res.byteViolationsDetected).toBe(0)
                }
                expect(() =>
                    AsciiGuardBuzz.assertSevenBitAscii(text),
                ).not.toThrow()
                expect(AsciiGuardBuzz.isSevenBitAsciiFast(text)).toBe(true)
            },
        )

        it('verifies byte boundaries for min and max printable characters plus LF', () => {
            const boundaryText =
                'Valid ' +
                String.fromCharCode(ASCII_PRINTABLE_MIN) +
                ' to ' +
                String.fromCharCode(ASCII_PRINTABLE_MAX) +
                '\n'
            expect(() => ClaimTextAsciiSchema.parse(boundaryText)).not.toThrow()
            expect(AsciiGuardBuzz.validateClaimText(boundaryText).isValid).toBe(
                true,
            )
        })
    })

    describe('Negative Controls (Multi-Byte & Typographic Incursions Fail Closed)', () => {
        it('rejects multi-byte emojis with NON_ASCII_BYTES_DETECTED', () => {
            const contaminated = 'Bog dislocated shoulder! \u{1F6A8} Emergency!'
            expect(() => ClaimTextAsciiSchema.parse(contaminated)).toThrow()
            const res = AsciiGuardBuzz.validateClaimText(contaminated)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('NON_ASCII_BYTES_DETECTED')
                expect(res.violations.length).toBeGreaterThan(0)
            }
            expect(() =>
                AsciiGuardBuzz.assertSevenBitAscii(contaminated),
            ).toThrow(/ASCII_GUARD_FAIL/)
            expect(AsciiGuardBuzz.isSevenBitAsciiFast(contaminated)).toBe(false)
        })

        it('rejects curly quotes and typographical dashes with NON_ASCII_BYTES_DETECTED', () => {
            const dirty = 'Bog\u2019s shoulder \u2014 dislocated'
            expect(() => ClaimTextAsciiSchema.parse(dirty)).toThrow()
            const res = AsciiGuardBuzz.validateClaimText(dirty)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('NON_ASCII_BYTES_DETECTED')
            }
        })

        it('rejects UTF-8 Byte Order Mark (BOM) at Byte 0 with BOM_PROHIBITED', () => {
            const bomText =
                String.fromCharCode(UTF8_BOM_CHAR_CODE) +
                'Bog shoulder dislocated.'
            expect(() => ClaimTextAsciiSchema.parse(bomText)).toThrow(
                /Byte Order Mark/,
            )
            const res = AsciiGuardBuzz.validateClaimText(bomText)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('BOM_PROHIBITED')
            }
        })

        it('rejects carriage returns (\\r) with CARRIAGE_RETURN_PROHIBITED', () => {
            const crText = 'Line one.\r\nLine two.'
            expect(() => ClaimTextAsciiSchema.parse(crText)).toThrow(
                /Carriage return/,
            )
            const res = AsciiGuardBuzz.validateClaimText(crText)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('CARRIAGE_RETURN_PROHIBITED')
            }
        })

        it('rejects ANSI terminal escape sequences with ANSI_ESCAPE_PROHIBITED', () => {
            const ansiText = '\x1b[31mRed Alert: Shoulder broken\x1b[0m'
            expect(() => ClaimTextAsciiSchema.parse(ansiText)).toThrow(
                /ANSI terminal escape/,
            )
            const res = AsciiGuardBuzz.validateClaimText(ansiText)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('ANSI_ESCAPE_PROHIBITED')
            }
        })

        it('rejects underflow strings shorter than 5 characters', () => {
            const short = 'Bad'
            expect(() => ClaimTextAsciiSchema.parse(short)).toThrow()
            const res = AsciiGuardBuzz.validateClaimText(short)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('LENGTH_UNDERFLOW')
            }
        })

        it('rejects overflow strings longer than 500 characters', () => {
            const long = 'a'.repeat(501)
            expect(() => ClaimTextAsciiSchema.parse(long)).toThrow()
            const res = AsciiGuardBuzz.validateClaimText(long)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('LENGTH_OVERFLOW')
            }
        })

        it('rejects non-string primitives fail-closed', () => {
            const primitives = [null, undefined, 12345, true, {}, []]
            for (const prim of primitives) {
                expect(() => ClaimTextAsciiSchema.parse(prim)).toThrow()
                const res = AsciiGuardBuzz.validateClaimText(prim)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('INVALID_TYPE')
                }
            }
        })
    })

    describe('Sanitization Invariants (Lossy Pure Transformation)', () => {
        it('sanitizes dirty text into 100% compliant 7-bit ASCII', () => {
            const contaminated =
                String.fromCharCode(UTF8_BOM_CHAR_CODE) +
                '\x1b[31mBog\u2019s shoulder\x1b[0m is \u201Cbroken\u201D\r\nEmergency \u2014 call medic!\u{1F6A8}'

            const receipt = AsciiGuardBuzz.sanitizeToSevenBitAscii(contaminated)

            expect(receipt.output).toBe(
                'Bog\'s shoulder is "broken"\nEmergency - call medic!',
            )
            expect(receipt.strippedByteCount).toBeGreaterThan(0)
            expect(receipt.normalizedLineEndingsCount).toBe(1)
            expect(receipt.unescapedAnsiCount).toBe(2)

            // Verify sanitized output passes strict validation
            const validation = AsciiGuardBuzz.validateClaimText(receipt.output)
            expect(validation.isValid).toBe(true)
        })

        it('preserves clean ASCII text without mutations', () => {
            const clean =
                'Valid 7-bit claim text with normal spaces and punctuation.'
            const receipt = AsciiGuardBuzz.sanitizeToSevenBitAscii(clean)
            expect(receipt.output).toBe(clean)
            expect(receipt.strippedByteCount).toBe(0)
        })
    })
})
