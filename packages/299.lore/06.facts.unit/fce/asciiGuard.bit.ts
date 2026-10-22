/**
 * Type interfaces for 7-bit ASCII validation and sanitization in 06.facts.unit.
 * Strict 7-bit ASCII compliance enforced.
 */

export interface AsciiViolationBit {
    readonly index: number
    readonly byteValue: number
    readonly hexToken: string
    readonly reason: string
}

export interface ValidatedAsciiClaimBit {
    readonly sanitizedText: string
    readonly length: number
    readonly byteViolationsDetected: number
    readonly isValid: true
}

export interface AsciiValidationFailureBit {
    readonly rawText: unknown
    readonly reason: string
    readonly violations: readonly AsciiViolationBit[]
    readonly errorCode:
        | 'INVALID_TYPE'
        | 'LENGTH_UNDERFLOW'
        | 'LENGTH_OVERFLOW'
        | 'CARRIAGE_RETURN_PROHIBITED'
        | 'BOM_PROHIBITED'
        | 'ANSI_ESCAPE_PROHIBITED'
        | 'NON_ASCII_BYTES_DETECTED'
    readonly isValid: false
}

export type AsciiValidationResult =
    ValidatedAsciiClaimBit | AsciiValidationFailureBit

export interface SanitizationReceiptBit {
    readonly originalLength: number
    readonly sanitizedLength: number
    readonly strippedByteCount: number
    readonly normalizedLineEndingsCount: number
    readonly unescapedAnsiCount: number
    readonly output: string
}
