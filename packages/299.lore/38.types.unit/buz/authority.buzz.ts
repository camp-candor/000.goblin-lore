import {
    AuthorityLevel,
    AuthorityLevelEnum,
    isAuthorityLevel,
} from '../val/authority.val.js'
import { AUTHORITY_RANK_MAP } from '../fce/authority.bit.js'

export interface PrecedenceEvaluationResult {
    readonly allowed: boolean
    readonly incomingLevel: AuthorityLevel
    readonly incomingRank: number
    readonly existingLevel: AuthorityLevel
    readonly existingRank: number
    readonly errorCode?: 'AUTHORITY_DEMOTION_BREACH' | 'INVALID_LEVEL_LITERAL'
    readonly message?: string
}

/**
 * Synchronous in-memory authority level assertion.
 * Halts execution immediately if an invalid tier is encountered at Stage T0 ($0.00).
 */
export function assertAuthorityLevel(candidate: unknown): AuthorityLevel {
    const result = AuthorityLevelEnum.safeParse(candidate)
    if (!result.success) {
        const errorDetails = result.error.errors
            .map((e) => e.message)
            .join('; ')
        throw new Error(
            `[AUTHORITY_CONTRACT_BREACH] Invalid AuthorityLevel: '${String(candidate)}'. ${errorDetails}`,
        )
    }
    return result.data
}

/**
 * Resolves the integer rank for a validated AuthorityLevel.
 */
export function getAuthorityRank(level: AuthorityLevel): number {
    return AUTHORITY_RANK_MAP[level]
}

/**
 * Pure comparator evaluating whether an incoming authority level has sufficient
 * precedence to update or overwrite an existing authority level.
 * An incoming level may overwrite an existing level ONLY IF: incomingRank >= existingRank.
 */
export function canOverwriteAuthority(
    incoming: AuthorityLevel,
    existing: AuthorityLevel,
): boolean {
    return AUTHORITY_RANK_MAP[incoming] >= AUTHORITY_RANK_MAP[existing]
}

/**
 * Evaluates precedence with structured diagnostic feedback.
 */
export function evaluatePrecedence(
    incoming: unknown,
    existing: unknown,
): PrecedenceEvaluationResult {
    if (!isAuthorityLevel(incoming) || !isAuthorityLevel(existing)) {
        return {
            allowed: false,
            incomingLevel: (isAuthorityLevel(incoming)
                ? incoming
                : 'SPECULATION') as AuthorityLevel,
            incomingRank: isAuthorityLevel(incoming)
                ? AUTHORITY_RANK_MAP[incoming]
                : 0,
            existingLevel: (isAuthorityLevel(existing)
                ? existing
                : 'AXIOM') as AuthorityLevel,
            existingRank: isAuthorityLevel(existing)
                ? AUTHORITY_RANK_MAP[existing]
                : 0,
            errorCode: 'INVALID_LEVEL_LITERAL',
            message:
                'One or both candidate authority levels are invalid literals.',
        }
    }

    const incomingRank = AUTHORITY_RANK_MAP[incoming]
    const existingRank = AUTHORITY_RANK_MAP[existing]

    if (incomingRank < existingRank) {
        return {
            allowed: false,
            incomingLevel: incoming,
            incomingRank,
            existingLevel: existing,
            existingRank,
            errorCode: 'AUTHORITY_DEMOTION_BREACH',
            message: `Authority demotion prohibited. Incoming '${incoming}' (rank ${incomingRank}) cannot overwrite existing '${existing}' (rank ${existingRank}).`,
        }
    }

    return {
        allowed: true,
        incomingLevel: incoming,
        incomingRank,
        existingLevel: existing,
        existingRank,
    }
}

/**
 * Hard fail-closed assertion for authority precedence.
 * Throws Error immediately if an illegal demotion is attempted at Stage T0 ($0.00).
 */
export function assertAuthorityPrecedence(
    incoming: AuthorityLevel,
    existing: AuthorityLevel,
): void {
    const result = evaluatePrecedence(incoming, existing)
    if (!result.allowed) {
        throw new Error(`[AUTHORITY_PRECEDENCE_BREACH] ${result.message}`)
    }
}
