/**
 * Type interfaces for 7-bit ASCII validation and sanitization in 06.facts.unit.
 * Strict 7-bit ASCII compliance enforced.
 */

export interface AsciiViolationBit {
    readonly byteOffset: number
    readonly charCode: number
    readonly hexToken: string
    readonly charSnippet: string
}

export interface ValidatedAsciiClaimBit {
    readonly raw: string
    readonly length: number
    readonly isValid: true
    readonly reason?: string
    readonly errorCode?: string
    readonly violations?: readonly AsciiViolationBit[]
}

export interface AsciiValidationFailureBit {
    readonly raw: unknown
    readonly reason: string
    readonly errorCode:
        | 'INVALID_TYPE'
        | 'LENGTH_UNDERFLOW'
        | 'LENGTH_OVERFLOW'
        | 'CARRIAGE_RETURN_FORBIDDEN'
        | 'UTF8_BOM_DETECTED'
        | 'ANSI_ESCAPE_DETECTED'
        | 'ASCII_INVARIANT_BREACH'
    readonly violations: readonly AsciiViolationBit[]
    readonly isValid: false
}

export type AsciiValidationResult =
    ValidatedAsciiClaimBit | AsciiValidationFailureBit

export interface SanitizationReceiptBit {
    readonly originalLength: number
    readonly sanitizedLength: number
    readonly strippedAnsiSequences: number
    readonly replacedNonAsciiChars: number
    readonly sanitizedText: string
}
