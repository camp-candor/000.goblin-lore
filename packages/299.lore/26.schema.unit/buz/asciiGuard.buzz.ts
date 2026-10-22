import {
    ASCII_LF,
    ASCII_PRINTABLE_MIN,
    ASCII_PRINTABLE_MAX,
    UTF8_BOM_CHAR_CODE,
    CLAIM_TEXT_MIN_LENGTH,
    CLAIM_TEXT_MAX_LENGTH,
    ANSI_ESCAPE_REGEX,
    ClaimTextAsciiSchema,
} from '../val/ascii.val.js'
import type {
    AsciiValidationResult,
    AsciiViolationBit,
    SanitizationReceiptBit,
    ValidatedAsciiClaimBit,
} from '../fce/asciiGuard.bit.js'

/**
 * Synchronous 7-bit ASCII sanitization and validation engine.
 * Emits deterministic diagnostic receipts in pure 7-bit ASCII.
 */
export class AsciiGuardBuzz {
    /**
     * Scans a string for individual character-level ASCII violations.
     */
    public static scanByteViolations(raw: string): AsciiViolationBit[] {
        const violations: AsciiViolationBit[] = []
        for (let i = 0; i < raw.length; i++) {
            const code = raw.charCodeAt(i)
            const isAllowedPrintable =
                code >= ASCII_PRINTABLE_MIN && code <= ASCII_PRINTABLE_MAX
            const isAllowedNewline = code === ASCII_LF

            if (!isAllowedPrintable && !isAllowedNewline) {
                violations.push({
                    byteOffset: i,
                    charCode: code,
                    hexToken: '0x' + code.toString(16).toUpperCase(),
                    charSnippet: code < 128 ? String.fromCharCode(code) : '?',
                })
            }
        }
        return violations
    }

    /**
     * Evaluates candidate claim text against 7-bit ASCII constraints.
     */
    public static validateClaimText(candidate: unknown): AsciiValidationResult {
        if (typeof candidate !== 'string') {
            return {
                raw: candidate,
                reason: 'Candidate claim text must be a string primitive',
                errorCode: 'INVALID_TYPE',
                violations: [],
                isValid: false,
            }
        }

        if (candidate.length < CLAIM_TEXT_MIN_LENGTH) {
            return {
                raw: candidate,
                reason: `Claim text underflow: length ${candidate.length} is below min ${CLAIM_TEXT_MIN_LENGTH}`,
                errorCode: 'LENGTH_UNDERFLOW',
                violations: [],
                isValid: false,
            }
        }

        if (candidate.length > CLAIM_TEXT_MAX_LENGTH) {
            return {
                raw: candidate,
                reason: `Claim text overflow: length ${candidate.length} exceeds max ${CLAIM_TEXT_MAX_LENGTH}`,
                errorCode: 'LENGTH_OVERFLOW',
                violations: [],
                isValid: false,
            }
        }

        if (candidate.charCodeAt(0) === UTF8_BOM_CHAR_CODE) {
            return {
                raw: candidate,
                reason: 'Byte-0 violation: Leading UTF-8 BOM (0xFEFF) detected',
                errorCode: 'UTF8_BOM_DETECTED',
                violations: [
                    {
                        byteOffset: 0,
                        charCode: UTF8_BOM_CHAR_CODE,
                        hexToken: '0xFEFF',
                        charSnippet: '?',
                    },
                ],
                isValid: false,
            }
        }

        if (candidate.includes('\r')) {
            const offset = candidate.indexOf('\r')
            return {
                raw: candidate,
                reason: 'Line-ending violation: Carriage return (\\r) detected. Use canonical LF (\\n).',
                errorCode: 'CARRIAGE_RETURN_FORBIDDEN',
                violations: [
                    {
                        byteOffset: offset,
                        charCode: 0x0d,
                        hexToken: '0x0D',
                        charSnippet: '\\r',
                    },
                ],
                isValid: false,
            }
        }

        ANSI_ESCAPE_REGEX.lastIndex = 0
        if (ANSI_ESCAPE_REGEX.test(candidate)) {
            // Reset regex state after test()
            ANSI_ESCAPE_REGEX.lastIndex = 0
            return {
                raw: candidate,
                reason: 'Security violation: ANSI terminal escape control sequence detected',
                errorCode: 'ANSI_ESCAPE_DETECTED',
                violations: [],
                isValid: false,
            }
        }

        const violations = this.scanByteViolations(candidate)
        if (violations.length > 0) {
            const first = violations[0]
            return {
                raw: candidate,
                reason: `7-bit ASCII invariant breach at byte ${first.byteOffset}: code ${first.hexToken}`,
                errorCode: 'ASCII_INVARIANT_BREACH',
                violations,
                isValid: false,
            }
        }

        const bit: ValidatedAsciiClaimBit = {
            raw: candidate,
            length: candidate.length,
            isValid: true,
        }
        return bit
    }

    /**
     * Asserts that candidate text is strictly 7-bit ASCII, throwing formatted Error on failure.
     */
    public static assertSevenBitAscii(
        candidate: unknown,
    ): asserts candidate is string {
        const result = this.validateClaimText(candidate)
        if (!result.isValid) {
            throw new Error(
                `[ASCII_INVARIANT_BREACH] Validation failed: ${result.reason} (code: ${result.errorCode})`,
            )
        }
    }

    /**
     * Deterministically sanitizes contaminated input down to clean 7-bit ASCII.
     * Strips ANSI escape codes, converts common typographic entities, purges non-ASCII bytes.
     */
    public static sanitizeToSevenBitAscii(raw: string): SanitizationReceiptBit {
        if (!raw) {
            return {
                originalLength: 0,
                sanitizedLength: 0,
                strippedAnsiSequences: 0,
                replacedNonAsciiChars: 0,
                sanitizedText: '',
            }
        }

        let strippedAnsiCount = 0
        const withoutAnsi = raw.replace(ANSI_ESCAPE_REGEX, () => {
            strippedAnsiCount++
            return ''
        })

        let replacedCount = 0
        let result = ''

        // Strip UTF-8 BOM if present
        const startIdx =
            withoutAnsi.charCodeAt(0) === UTF8_BOM_CHAR_CODE ? 1 : 0
        if (startIdx > 0) {
            replacedCount++
        }

        for (let i = startIdx; i < withoutAnsi.length; i++) {
            const code = withoutAnsi.charCodeAt(i)

            // Normalize CRLF to LF
            if (code === 0x0d) {
                replacedCount++
                continue
            }

            // Map common typographic replacements
            if (code === 0x2018 || code === 0x2019) {
                // Smart single quotes
                result += "'"
                replacedCount++
                continue
            }
            if (code === 0x201c || code === 0x201d) {
                // Smart double quotes
                result += '"'
                replacedCount++
                continue
            }
            if (code === 0x2013 || code === 0x2014) {
                // En-dash / Em-dash
                result += '-'
                replacedCount++
                continue
            }
            if (code === 0x2026) {
                // Ellipsis
                result += '...'
                replacedCount++
                continue
            }

            // Allowed 7-bit ASCII: 0x20-0x7E or 0x0A (LF)
            if (
                (code >= ASCII_PRINTABLE_MIN && code <= ASCII_PRINTABLE_MAX) ||
                code === ASCII_LF
            ) {
                result += withoutAnsi[i]
            } else {
                // Strip out unknown multi-byte characters
                replacedCount++
            }
        }

        return {
            originalLength: raw.length,
            sanitizedLength: result.length,
            strippedAnsiSequences: strippedAnsiCount,
            replacedNonAsciiChars: replacedCount,
            sanitizedText: result.trim(),
        }
    }

    /**
     * Fast boolean pre-flight check avoiding object allocation.
     */
    public static isSevenBitAsciiFast(candidate: string): boolean {
        if (
            candidate.length < CLAIM_TEXT_MIN_LENGTH ||
            candidate.length > CLAIM_TEXT_MAX_LENGTH
        ) {
            return false
        }
        for (let i = 0; i < candidate.length; i++) {
            const code = candidate.charCodeAt(i)
            const ok =
                (code >= ASCII_PRINTABLE_MIN && code <= ASCII_PRINTABLE_MAX) ||
                code === ASCII_LF
            if (!ok) return false
        }
        return true
    }
}
