import { describe, it, expect } from 'vitest'
import { ClaimTextAsciiSchema } from '../val/ascii.val.js'
import { AsciiGuardBuzz } from '../buz/asciiGuard.buzz.js'
import { SchemaAction } from '../act/schema.action.js'

// Adversarial glyph fixtures, constructed at runtime so this source file
// stays strictly 7-bit ASCII while exercising the exact spec code points.
const ESC = String.fromCharCode(0x1b)
const BOM = String.fromCharCode(0xfeff)
const LSQ = String.fromCharCode(0x2018)
const RSQ = String.fromCharCode(0x2019)
const LDQ = String.fromCharCode(0x201c)
const RDQ = String.fromCharCode(0x201d)
const EMDASH = String.fromCharCode(0x2014)
const SKULL = String.fromCodePoint(0x1f480)
const LOCK = String.fromCodePoint(0x1f512)
const ROCKET = String.fromCodePoint(0x1f680)

describe('06.facts.unit :: Seven-Bit ASCII Claim Text Sanitizer', () => {
    describe('Positive Controls (Valid 7-Bit ASCII Claims)', () => {
        it('accepts clean 7-bit ASCII claims with standard punctuation', () => {
            const validCases = [
                'Bog right brachial plexus is severed at the cervical root.',
                'Valve 04 in culvert is seized in shut orientation.',
                'Wart carries an iron pry bar (mass: 240g, slots: 1).',
                'Ambient noise floor: 45 cdB (Steam Hiss).',
                'Line one of claim.\nLine two of claim.',
            ]

            for (const text of validCases) {
                expect(ClaimTextAsciiSchema.parse(text)).toBe(text)
                const res = AsciiGuardBuzz.validateClaimText(text)
                expect(res.isValid).toBe(true)
                expect(AsciiGuardBuzz.isSevenBitAsciiFast(text)).toBe(true)
                expect(() =>
                    AsciiGuardBuzz.assertSevenBitAscii(text),
                ).not.toThrow()
            }
        })

        it('processes validation through SchemaAction dispatcher', () => {
            const text = 'The siphon line is dry.'
            const res = SchemaAction.validateFactClaimAscii({ claimText: text })
            expect(res.isValid).toBe(true)
            if (res.isValid) {
                expect(res.length).toBe(text.length)
            }
        })
    })

    describe('Negative Controls (Malformed and Non-ASCII Inputs Fail Closed)', () => {
        it('rejects multi-byte emojis with ASCII_INVARIANT_BREACH', () => {
            const emojiCases = [
                'Bog right arm is broken ' + SKULL + ' completely.',
                'Valve 04 is sealed ' + LOCK + ' shut.',
                ROCKET + ' Rocket ship in the culvert.',
            ]

            for (const text of emojiCases) {
                expect(() => ClaimTextAsciiSchema.parse(text)).toThrow()
                const res = AsciiGuardBuzz.validateClaimText(text)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('ASCII_INVARIANT_BREACH')
                    expect(res.violations.length).toBeGreaterThan(0)
                }
                expect(() => AsciiGuardBuzz.assertSevenBitAscii(text)).toThrow(
                    /ASCII_INVARIANT_BREACH/,
                )
                expect(AsciiGuardBuzz.isSevenBitAsciiFast(text)).toBe(false)
            }
        })

        it('rejects smart quotes and em-dashes prior to sanitization', () => {
            const typographicCases = [
                'Bog says: ' + LDQ + 'The valve is stuck.' + RDQ,
                'Bog says: ' + LSQ + 'The valve is stuck.' + RSQ,
                'Culvert siphon ' + EMDASH + ' severed by rust.',
            ]

            for (const text of typographicCases) {
                expect(() => ClaimTextAsciiSchema.parse(text)).toThrow()
                const res = AsciiGuardBuzz.validateClaimText(text)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('ASCII_INVARIANT_BREACH')
                }
            }
        })

        it('rejects ANSI terminal control escape sequences', () => {
            const ansiCases = [
                ESC + '[31mBog arm is broken' + ESC + '[0m',
                ESC + '[2JClear screen injection',
                'Valve ' + ESC + '[?25l invisible cursor',
            ]

            for (const text of ansiCases) {
                expect(() => ClaimTextAsciiSchema.parse(text)).toThrow()
                const res = AsciiGuardBuzz.validateClaimText(text)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('ANSI_ESCAPE_DETECTED')
                }
            }
        })

        it('rejects leading UTF-8 Byte Order Marks (0xFEFF)', () => {
            const bomText = BOM + 'Bog right shoulder is dislocated.'
            expect(() => ClaimTextAsciiSchema.parse(bomText)).toThrow(
                /UTF-8 BOM/,
            )
            const res = AsciiGuardBuzz.validateClaimText(bomText)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('UTF8_BOM_DETECTED')
            }
        })

        it('rejects carriage returns (\\r)', () => {
            const crlfText = 'Bog right shoulder.\r\nSecond line.'
            expect(() => ClaimTextAsciiSchema.parse(crlfText)).toThrow(
                /Carriage return/,
            )
            const res = AsciiGuardBuzz.validateClaimText(crlfText)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('CARRIAGE_RETURN_FORBIDDEN')
            }
        })

        it('rejects length underflow (< 5 chars) and overflow (> 500 chars)', () => {
            const tooShort = 'Tiny'
            const tooLong = 'A'.repeat(501)

            expect(() => ClaimTextAsciiSchema.parse(tooShort)).toThrow()
            expect(() => ClaimTextAsciiSchema.parse(tooLong)).toThrow()

            const shortRes = AsciiGuardBuzz.validateClaimText(tooShort)
            expect(shortRes.isValid).toBe(false)
            if (!shortRes.isValid) {
                expect(shortRes.errorCode).toBe('LENGTH_UNDERFLOW')
            }

            const longRes = AsciiGuardBuzz.validateClaimText(tooLong)
            expect(longRes.isValid).toBe(false)
            if (!longRes.isValid) {
                expect(longRes.errorCode).toBe('LENGTH_OVERFLOW')
            }
        })

        it('rejects non-string primitives', () => {
            const cases = [12345, null, undefined, {}, true]
            for (const c of cases) {
                const res = AsciiGuardBuzz.validateClaimText(c)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('INVALID_TYPE')
                }
            }
        })
    })

    describe('Sanitization & Purging (sanitizeToSevenBitAscii)', () => {
        it('strips ANSI escapes and converts curly quotes to straight quotes', () => {
            const dirty =
                ESC +
                '[31mBog said: ' +
                LDQ +
                'Take the valve.' +
                RDQ +
                ESC +
                '[0m'
            const receipt = AsciiGuardBuzz.sanitizeToSevenBitAscii(dirty)

            expect(receipt.strippedAnsiSequences).toBe(2)
            expect(receipt.sanitizedText).toBe('Bog said: "Take the valve."')
            expect(
                AsciiGuardBuzz.isSevenBitAsciiFast(receipt.sanitizedText),
            ).toBe(true)
        })

        it('converts em-dashes and strips multi-byte emojis', () => {
            const dirty =
                'Siphon ' +
                EMDASH +
                ' severed ' +
                SKULL +
                ' completely by rust.'
            const receipt = SchemaAction.sanitizeFactClaimAscii({
                rawText: dirty,
            })

            expect(receipt.sanitizedText).toBe(
                'Siphon - severed  completely by rust.',
            )
            expect(receipt.replacedNonAsciiChars).toBeGreaterThan(0)
            expect(
                AsciiGuardBuzz.isSevenBitAsciiFast(receipt.sanitizedText),
            ).toBe(true)
        })

        it('purges UTF-8 BOM and normalizes CRLF to LF', () => {
            const dirty = BOM + 'Line one.\r\nLine two.'
            const receipt = AsciiGuardBuzz.sanitizeToSevenBitAscii(dirty)

            expect(receipt.sanitizedText).toBe('Line one.\nLine two.')
            expect(receipt.sanitizedText.charCodeAt(0)).not.toBe(0xfeff)
            expect(receipt.sanitizedText.includes('\r')).toBe(false)
        })

        it('handles empty strings gracefully', () => {
            const receipt = AsciiGuardBuzz.sanitizeToSevenBitAscii('')
            expect(receipt.sanitizedText).toBe('')
            expect(receipt.sanitizedLength).toBe(0)
        })
    })
})
