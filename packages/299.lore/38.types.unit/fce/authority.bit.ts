import { AuthorityLevel } from '../val/authority.val.js'

/**
 * Discrete integer rank mapping for authority tiers.
 * Higher integer values represent higher legislative precedence.
 * Zero floating-point arithmetic permitted.
 */
export const AUTHORITY_RANK_MAP: Readonly<Record<AuthorityLevel, number>> =
    Object.freeze({
        AXIOM: 600,
        CANON: 500,
        EVENT: 400,
        RUNTIME_STATE: 300,
        PROJECTION: 200,
        SPECULATION: 100,
    })

export interface AuthorityLevelBit {
    readonly level: AuthorityLevel
    readonly rank: number
    readonly description: string
    readonly writableBy:
        | 'HUMAN_GIT_COMMIT'
        | 'SIMULATION_REDUCER'
        | 'PROJECTION_ENGINE'
        | 'UNTRUSTED_INFERENCE'
}

/**
 * Metadata descriptors for TUI display and diagnostic receipts.
 */
export const AUTHORITY_DEFINITIONS: Readonly<
    Record<AuthorityLevel, AuthorityLevelBit>
> = Object.freeze({
    AXIOM: Object.freeze({
        level: 'AXIOM',
        rank: 600,
        description:
            'Universal storyworld physics, mathematical invariants, and absolute system taboos.',
        writableBy: 'HUMAN_GIT_COMMIT',
    }),
    CANON: Object.freeze({
        level: 'CANON',
        rank: 500,
        description:
            'Static baseline character dossiers, locations, and registered grievances.',
        writableBy: 'HUMAN_GIT_COMMIT',
    }),
    EVENT: Object.freeze({
        level: 'EVENT',
        rank: 400,
        description:
            'Append-only ledger entries recording historical occurrences and duel outcomes.',
        writableBy: 'SIMULATION_REDUCER',
    }),
    RUNTIME_STATE: Object.freeze({
        level: 'RUNTIME_STATE',
        rank: 300,
        description:
            'Materialized state projections folded from events over base canon.',
        writableBy: 'SIMULATION_REDUCER',
    }),
    PROJECTION: Object.freeze({
        level: 'PROJECTION',
        rank: 200,
        description:
            'Derived screenplay ASTs, exposure sheets, and temporal cue tracks.',
        writableBy: 'PROJECTION_ENGINE',
    }),
    SPECULATION: Object.freeze({
        level: 'SPECULATION',
        rank: 100,
        description:
            'Probabilistic LLM drafts, unratified dialogue, and creative suggestions.',
        writableBy: 'UNTRUSTED_INFERENCE',
    }),
})
