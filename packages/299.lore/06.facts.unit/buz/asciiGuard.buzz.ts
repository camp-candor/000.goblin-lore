import {
    ASCII_LF,
    ASCII_PRINTABLE_MIN,
    ASCII_PRINTABLE_MAX,
    UTF8_BOM_CHAR_CODE,
    CLAIM_TEXT_MIN_LENGTH,
    CLAIM_TEXT_MAX_LENGTH,
    ANSI_ESCAPE_REGEX,
    ASCII_STRICT_REGEX,
    ClaimTextAsciiSchema,
} from '../val/ascii.val.js'
import type {
    AsciiViolationBit,
    ValidatedAsciiClaimBit,
    AsciiValidationResult,
    SanitizationReceiptBit,
} from '../fce/asciiGuard.bit.js'

/**
 * Synchronous 7-bit ASCII validation and sanitization engine for 06.facts.unit.
 * Operates in memory at Stage T0 = $0.00. Emits 7-bit ASCII receipts.
 */
export class AsciiGuardBuzz {
    /**
     * Fast byte scanner detecting non-ASCII, carriage returns, or control characters.
     */
    public static scanByteViolations(text: string): AsciiViolationBit[] {
        const violations: AsciiViolationBit[] = []
        for (let i = 0; i < text.length; i++) {
            const code = text.charCodeAt(i)
            if (code === 0x0d) {
                violations.push({
                    index: i,
                    byteValue: code,
                    hexToken: '0x0D',
                    reason: 'Carriage return (\\r) prohibited; must use LF (\\n)',
                })
            } else if (code === UTF8_BOM_CHAR_CODE) {
                violations.push({
                    index: i,
                    byteValue: code,
                    hexToken: '0xFEFF',
                    reason: 'UTF-8 BOM marker prohibited',
                })
            } else if (code > 0x7f) {
                violations.push({
                    index: i,
                    byteValue: code,
                    hexToken: `0x${code.toString(16).toUpperCase()}`,
                    reason: 'Non-ASCII character exceeds 7-bit bounds (> 0x7F)',
                })
            } else if (code < ASCII_PRINTABLE_MIN && code !== ASCII_LF) {
                violations.push({
                    index: i,
                    byteValue: code,
                    hexToken: `0x${code.toString(16).padStart(2, '0').toUpperCase()}`,
                    reason: 'Unpermitted control character (< 0x20 and != 0x0A)',
                })
            }
        }
        return violations
    }

    /**
     * Evaluates candidate claim text against strict 7-bit ASCII invariants.
     */
    public static validateClaimText(candidate: unknown): AsciiValidationResult {
        if (typeof candidate !== 'string') {
            return {
                rawText: candidate,
                reason: 'Candidate claim text must be a string primitive',
                violations: [],
                errorCode: 'INVALID_TYPE',
                isValid: false,
            }
        }

        if (candidate.length < CLAIM_TEXT_MIN_LENGTH) {
            return {
                rawText: candidate,
                reason: `Claim text underflow: length ${candidate.length} is less than minimum ${CLAIM_TEXT_MIN_LENGTH}`,
                violations: [],
                errorCode: 'LENGTH_UNDERFLOW',
                isValid: false,
            }
        }

        if (candidate.length > CLAIM_TEXT_MAX_LENGTH) {
            return {
                rawText: candidate,
                reason: `Claim text overflow: length ${candidate.length} exceeds maximum ${CLAIM_TEXT_MAX_LENGTH}`,
                violations: [],
                errorCode: 'LENGTH_OVERFLOW',
                isValid: false,
            }
        }

        if (candidate.charCodeAt(0) === UTF8_BOM_CHAR_CODE) {
            return {
                rawText: candidate,
                reason: 'UTF-8 BOM detected at Byte 0',
                violations: this.scanByteViolations(candidate),
                errorCode: 'BOM_PROHIBITED',
                isValid: false,
            }
        }

        if (candidate.includes('\r')) {
            return {
                rawText: candidate,
                reason: 'Carriage return (\\r) detected in claim text',
                violations: this.scanByteViolations(candidate),
                errorCode: 'CARRIAGE_RETURN_PROHIBITED',
                isValid: false,
            }
        }

        if (ANSI_ESCAPE_REGEX.test(candidate)) {
            return {
                rawText: candidate,
                reason: 'ANSI escape sequence detected in claim text',
                violations: this.scanByteViolations(candidate),
                errorCode: 'ANSI_ESCAPE_PROHIBITED',
                isValid: false,
            }
        }

        const violations = this.scanByteViolations(candidate)
        if (violations.length > 0) {
            return {
                rawText: candidate,
                reason: `7-bit ASCII breach: ${violations.length} non-compliant byte(s) detected`,
                violations,
                errorCode: 'NON_ASCII_BYTES_DETECTED',
                isValid: false,
            }
        }

        return {
            sanitizedText: candidate,
            length: candidate.length,
            byteViolationsDetected: 0,
            isValid: true,
        }
    }

    /**
     * Asserts whether candidate text obeys 7-bit ASCII, throwing formatted Error on failure.
     */
    public static assertSevenBitAscii(
        candidate: unknown,
    ): asserts candidate is string {
        const result = this.validateClaimText(candidate)
        if (!result.isValid) {
            throw new Error(
                `[ASCII_GUARD_FAIL] Validation error: ${result.reason} (code: ${result.errorCode})`,
            )
        }
    }

    /**
     * Sanitizes dirty or contaminated text down to clean 7-bit ASCII.
     * Strips UTF-8 BOM, normalizes CRLF -> LF, replaces smart quotes and dashes,
     * removes ANSI escape codes, and filters remaining multi-byte bytes.
     */
    public static sanitizeToSevenBitAscii(raw: string): SanitizationReceiptBit {
        const originalLength = raw.length
        let output = raw

        // 1. Strip BOM
        if (output.charCodeAt(0) === UTF8_BOM_CHAR_CODE) {
            output = output.slice(1)
        }

        // 2. Normalize CRLF / CR -> LF
        const beforeCrCount = (output.match(/\r/g) || []).length
        output = output.replace(/\r\n/g, '\n').replace(/\r/g, '\n')

        // 3. Strip ANSI sequences
        const ansiMatches = output.match(ANSI_ESCAPE_REGEX) || []
        output = output.replace(ANSI_ESCAPE_REGEX, '')

        // 4. Map typographical anomalies to standard 7-bit ASCII
        output = output
            .replace(/[\u2018\u2019\u201A\u201B]/g, "'") // Single quotes / apostrophes
            .replace(/[\u201C\u201D\u201E\u201F]/g, '"') // Double quotes
            .replace(/[\u2013\u2014]/g, '-') // En-dash / Em-dash
            .replace(/\u2026/g, '...') // Horizontal ellipsis

        // 5. Filter any remaining characters outside 7-bit printable ASCII + LF
        let strippedCount = 0
        let clean = ''
        for (let i = 0; i < output.length; i++) {
            const code = output.charCodeAt(i)
            if (
                (code >= ASCII_PRINTABLE_MIN && code <= ASCII_PRINTABLE_MAX) ||
                code === ASCII_LF
            ) {
                clean += output[i]
            } else {
                strippedCount++
            }
        }

        return {
            originalLength,
            sanitizedLength: clean.length,
            strippedByteCount: strippedCount,
            normalizedLineEndingsCount: beforeCrCount,
            unescapedAnsiCount: ansiMatches.length,
            output: clean,
        }
    }

    /**
     * Fast Boolean check for pre-flight routing.
     */
    public static isSevenBitAsciiFast(candidate: unknown): boolean {
        if (typeof candidate !== 'string') return false
        if (
            candidate.length < CLAIM_TEXT_MIN_LENGTH ||
            candidate.length > CLAIM_TEXT_MAX_LENGTH
        )
            return false
        return ASCII_STRICT_REGEX.test(candidate) && !candidate.includes('\r')
    }
}
