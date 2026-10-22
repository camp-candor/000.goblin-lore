/**
 * Type interfaces for deterministic epoch integer tokens in 26.schema.unit.
 * Strict 7-bit ASCII compliance enforced.
 */

export interface ValidatedEpochIntegerBit {
    readonly value: number
    readonly isSafeInteger: true
    readonly isNonNegative: true
    readonly isValid: true
}

export interface EpochValidationFailureBit {
    readonly raw: unknown
    readonly reason: string
    readonly errorCode:
        | 'INVALID_TYPE'
        | 'FLOAT_PROHIBITED'
        | 'NEGATIVE_INTEGER_PROHIBITED'
        | 'UNSAFE_INTEGER_OVERFLOW'
        | 'TEMPORAL_ORDER_VIOLATION'
    readonly isValid: false
}

export type EpochValidationResult =
    ValidatedEpochIntegerBit | EpochValidationFailureBit

export interface FactEpochTriadBit {
    readonly createdAtEpoch: number
    readonly lastMutatedEpoch: number
    readonly lastReconsideredEpoch: number
}
