import { z } from 'zod'

/**
 * Closed Ontological Authority Level Enumeration.
 * Strictly stratifies propositions across six legislative tiers:
 * - AXIOM: Universal storyworld physics and mathematical invariants.
 * - CANON: Human-authored baseline lore dossiers in 000.goblin-lore.
 * - EVENT: Ratified append-only historical simulation occurrences.
 * - RUNTIME_STATE: Dynamic materialized state folded from events.
 * - PROJECTION: Screenplay ASTs, exposure sheets, and staging cues.
 * - SPECULATION: Probabilistic generative proposals and unratified drafts.
 */
export const AuthorityLevelEnum = z.enum([
    'AXIOM',
    'CANON',
    'EVENT',
    'RUNTIME_STATE',
    'PROJECTION',
    'SPECULATION',
])

export type AuthorityLevel = z.infer<typeof AuthorityLevelEnum>

/**
 * Array of all valid AuthorityLevel string literals for runtime iteration and guards.
 */
export const VALID_AUTHORITY_LEVELS: readonly AuthorityLevel[] = Object.freeze([
    'AXIOM',
    'CANON',
    'EVENT',
    'RUNTIME_STATE',
    'PROJECTION',
    'SPECULATION',
] as const)

/**
 * Pure type-guard checking whether an arbitrary string conforms to AuthorityLevel.
 */
export function isAuthorityLevel(value: unknown): value is AuthorityLevel {
    return (
        typeof value === 'string' &&
        VALID_AUTHORITY_LEVELS.includes(value as AuthorityLevel)
    )
}

/**
 * Synchronously validates whether a candidate is a valid AuthorityLevel.
 * Throws ZodError if invalid.
 */
export function validateAuthorityLevel(rawLevel: unknown): AuthorityLevel {
    return AuthorityLevelEnum.parse(rawLevel)
}
