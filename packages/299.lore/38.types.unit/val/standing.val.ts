import { z } from 'zod'

/**
 * Closed Ontological Tri-State Standing Enumeration.
 * Governs the epistemological validity and invalidation lifecycle of narrative facts:
 * - ACTIVE_ENDORSED: Fully certified canonical law enforced across all compile gates.
 * - FLAGGED_FOR_REVIEW: Liminal state under active editorial debate; zero downstream cascade.
 * - DEPRECATED_ARCHIVED: Decommissioned canon; triggers downstream invalidation cascades.
 */
export const TriStateStandingEnum = z.enum([
    'ACTIVE_ENDORSED',
    'FLAGGED_FOR_REVIEW',
    'DEPRECATED_ARCHIVED',
])

export type TriStateStanding = z.infer<typeof TriStateStandingEnum>

/**
 * Array of all valid TriStateStanding string literals for runtime iteration and guards.
 */
export const VALID_TRI_STATE_STANDINGS: readonly TriStateStanding[] =
    Object.freeze([
        'ACTIVE_ENDORSED',
        'FLAGGED_FOR_REVIEW',
        'DEPRECATED_ARCHIVED',
    ] as const)

/**
 * Pure type-guard checking whether an arbitrary value conforms to TriStateStanding.
 */
export function isTriStateStanding(value: unknown): value is TriStateStanding {
    return (
        typeof value === 'string' &&
        VALID_TRI_STATE_STANDINGS.includes(value as TriStateStanding)
    )
}

/**
 * Synchronously validates whether a candidate is a valid TriStateStanding literal.
 * Throws ZodError if invalid.
 */
export function validateTriStateStanding(
    rawStanding: unknown,
): TriStateStanding {
    return TriStateStandingEnum.parse(rawStanding)
}
