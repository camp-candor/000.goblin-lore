import { FactScope } from '../../38.types.unit/val/scope.val.js'
import { FactContentHashBit, HashParityResult } from '../fce/canonHash.bit.js'
import {
    createFactContentHashBit,
    verifyFactContentHashParity,
    assertFactContentHashParity,
} from '../buz/canonHash.buzz.js'

export const CanonActions = {
    COMPUTE_FACT_HASH: 'canon/compute-fact-hash',
    VERIFY_HASH_PARITY: 'canon/verify-hash-parity',
    ASSERT_HASH_PARITY: 'canon/assert-hash-parity',
} as const

export function computeFactHashAction(payload: {
    scope: FactScope
    claimText: string
}): FactContentHashBit {
    return createFactContentHashBit(payload.scope, payload.claimText)
}

export function verifyHashParityAction(payload: {
    expectedHash: string
    scope: string
    claimText: string
}): HashParityResult {
    return verifyFactContentHashParity(
        payload.expectedHash,
        payload.scope,
        payload.claimText,
    )
}

export function assertHashParityAction(payload: {
    expectedHash: string
    scope: string
    claimText: string
}): void {
    assertFactContentHashParity(
        payload.expectedHash,
        payload.scope,
        payload.claimText,
    )
}
