import { FactScope, FactScopeEnum, isFactScope } from '../val/scope.val.js'
import { SCOPE_PREFIX_MAP } from '../fce/scope.bit.js'

export interface ScopeValidationSuccess {
    readonly valid: true
    readonly scope: FactScope
}

export interface ScopeValidationFailure {
    readonly valid: false
    readonly errorCode: 'INVALID_SCOPE_LITERAL' | 'PREFIX_SCOPE_MISMATCH'
    readonly message: string
}

export type ScopeValidationResult =
    ScopeValidationSuccess | ScopeValidationFailure

/**
 * Synchronous in-memory scope assertion.
 * Halts execution immediately if an invalid scope is encountered at Stage T0 ($0.00).
 */
export function assertFactScope(candidate: unknown): FactScope {
    const result = FactScopeEnum.safeParse(candidate)
    if (!result.success) {
        const errorDetails = result.error.errors
            .map((e) => e.message)
            .join('; ')
        throw new Error(
            `[SCOPE_CONTRACT_BREACH] Invalid FactScope: '${String(candidate)}'. ${errorDetails}`,
        )
    }
    return result.data
}

/**
 * Validates that an entity identifier strictly adheres to its declared FactScope prefix.
 */
export function validateEntityPrefixAlignment(
    scope: unknown,
    entityId: string,
): ScopeValidationResult {
    if (!isFactScope(scope)) {
        return {
            valid: false,
            errorCode: 'INVALID_SCOPE_LITERAL',
            message: `Value '${String(scope)}' is not a valid FactScope literal.`,
        }
    }

    const expectedPrefix = SCOPE_PREFIX_MAP[scope]
    if (!entityId.startsWith(expectedPrefix)) {
        return {
            valid: false,
            errorCode: 'PREFIX_SCOPE_MISMATCH',
            message: `Entity ID '${entityId}' does not align with Scope '${scope}'. Mandatory prefix: '${expectedPrefix}'.`,
        }
    }

    return {
        valid: true,
        scope,
    }
}
