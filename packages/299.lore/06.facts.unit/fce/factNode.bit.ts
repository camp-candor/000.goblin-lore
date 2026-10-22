import type { FactScope } from '../../38.types.unit/val/scope.val.js'
import type { AuthorityLevel } from '../../38.types.unit/val/authority.val.js'
import type { TriStateStanding } from '../../38.types.unit/val/standing.val.js'

/**
 * 11-Property Canonical Fact Node Contract Bit.
 * Strictly mirrors the closed FactNodeSchema.
 */
export interface FactNodeBit {
    readonly id: string
    readonly claim_text: string
    readonly scope: FactScope
    readonly authority_level: AuthorityLevel
    readonly standing: TriStateStanding
    readonly version: number
    readonly content_hash: string
    readonly author: string
    readonly created_at_epoch: number
    readonly last_mutated_epoch: number
    readonly last_reconsidered_epoch: number
}

export interface FactClosureValidationSuccessBit {
    readonly data: FactNodeBit
    readonly propertyCount: 11
    readonly isValid: true
    readonly reason?: string
    readonly errorCode?: string
    readonly unrecognizedKeys?: readonly string[]
}

export interface FactClosureValidationFailureBit {
    readonly raw: unknown
    readonly reason: string
    readonly unrecognizedKeys: readonly string[]
    readonly errorCode:
        'UNRECOGNIZED_KEYS' | 'MISSING_MANDATORY_FIELD' | 'INVALID_TYPE'
    readonly isValid: false
}

export type FactClosureValidationResult =
    FactClosureValidationSuccessBit | FactClosureValidationFailureBit
