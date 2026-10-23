import { FactScope } from '../../38.types.unit/val/scope.val.js'

export interface FactContentHashBit {
    readonly scope: FactScope
    readonly normalizedClaim: string
    readonly contentHash: string
    readonly canonicalJson: string
}

export interface HashParitySuccess {
    readonly valid: true
    readonly scope: FactScope
    readonly contentHash: string
    readonly matchesExpected: true
    readonly errorCode?: undefined
    readonly expectedHash?: undefined
    readonly actualHash?: undefined
    readonly message?: undefined
}

export interface HashParityFailure {
    readonly valid: false
    readonly errorCode: 'CONTENT_HASH_PARITY_MISMATCH' | 'INVALID_HASH_INPUT'
    readonly scope: FactScope
    readonly expectedHash: string
    readonly actualHash: string
    readonly message: string
    readonly matchesExpected?: undefined
}

export type HashParityResult = HashParitySuccess | HashParityFailure
