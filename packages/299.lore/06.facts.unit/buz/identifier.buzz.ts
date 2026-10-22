import {
    FactIdSchema,
    AuthorHandleSchema,
    Sha256HashSchema,
    FACT_ID_REGEX,
} from '../val/identifier.val.js'
import type {
    IdentifierValidationResult,
    ValidatedFactIdentifierBit,
} from '../fce/identifier.bit.js'

/**
 * Synchronous in-memory identifier validation engine.
 * Emits strictly 7-bit ASCII diagnostic receipts.
 */
export class IdentifierGateBuzz {
    /**
     * Evaluates candidate fact identifier string.
     */
    public static validateFactId(
        candidate: unknown,
    ): IdentifierValidationResult {
        if (typeof candidate !== 'string') {
            return {
                raw: candidate,
                reason: 'Candidate identifier must be a string primitive',
                errorCode: 'INVALID_TYPE',
                isValid: false,
            }
        }

        const parseResult = FactIdSchema.safeParse(candidate)
        if (!parseResult.success) {
            const issue = parseResult.error.issues[0]
            return {
                raw: candidate,
                reason: issue
                    ? issue.message
                    : 'Unknown pattern validation error',
                errorCode:
                    candidate.length < 6 || candidate.length > 128
                        ? 'LENGTH_VIOLATION'
                        : 'INVALID_PATTERN',
                isValid: false,
            }
        }

        const slug = candidate.slice(5) // Strips 'fact_' prefix
        const bit: ValidatedFactIdentifierBit = {
            raw: candidate,
            slug,
            length: candidate.length,
            isValid: true,
        }
        return bit
    }

    /**
     * Asserts whether candidate identifier is valid, throwing formatted Error on failure.
     */
    public static assertFactId(
        candidate: unknown,
    ): asserts candidate is string {
        const result = this.validateFactId(candidate)
        if (!result.isValid) {
            throw new Error(
                `[SCHEMA_GATE_FAIL] Identifier pattern breach: ${result.reason} (code: ${result.errorCode})`,
            )
        }
    }

    /**
     * Validates author handle against snake_case contract.
     */
    public static validateAuthor(candidate: unknown): boolean {
        return AuthorHandleSchema.safeParse(candidate).success
    }

    /**
     * Validates SHA-256 digest against 64 lowercase hex contract.
     */
    public static validateHash(candidate: unknown): boolean {
        return Sha256HashSchema.safeParse(candidate).success
    }

    /**
     * Fast pre-flight regex check.
     */
    public static isFactIdFast(candidate: unknown): boolean {
        if (typeof candidate !== 'string') return false
        if (candidate.length < 6 || candidate.length > 128) return false
        return FACT_ID_REGEX.test(candidate)
    }
}
