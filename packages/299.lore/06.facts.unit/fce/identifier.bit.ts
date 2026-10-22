/**
 * Type interfaces for validated identifier tokens in 06.facts.unit.
 * Strict 7-bit ASCII compliance enforced.
 */

export interface ValidatedFactIdentifierBit {
    readonly raw: string
    readonly slug: string
    readonly prefix: 'fact_'
    readonly isValid: true
}

export interface IdentifierValidationFailureBit {
    readonly raw: unknown
    readonly reason: string
    readonly errorCode: 'INVALID_PATTERN' | 'INVALID_TYPE' | 'LENGTH_VIOLATION'
    readonly isValid: false
}

export type IdentifierValidationResult =
    ValidatedFactIdentifierBit | IdentifierValidationFailureBit
