import { TriStateStanding } from '../val/standing.val.js'

export type BadgeColor = 'GREEN' | 'YELLOW' | 'RED'

export interface TriStateStandingBit {
    readonly standing: TriStateStanding
    readonly badgeColor: BadgeColor
    readonly cascadeOnEnter: boolean
    readonly compileEnforced: boolean
    readonly description: string
}

/**
 * Metadata descriptors for TUI display, compiler gating, and downstream invalidation rules.
 */
export const STANDING_DEFINITIONS: Readonly<
    Record<TriStateStanding, TriStateStandingBit>
> = Object.freeze({
    ACTIVE_ENDORSED: Object.freeze({
        standing: 'ACTIVE_ENDORSED',
        badgeColor: 'GREEN',
        cascadeOnEnter: false,
        compileEnforced: true,
        description:
            'Fully certified canonical law enforced across all compile gates.',
    }),
    FLAGGED_FOR_REVIEW: Object.freeze({
        standing: 'FLAGGED_FOR_REVIEW',
        badgeColor: 'YELLOW',
        cascadeOnEnter: false,
        compileEnforced: false,
        description:
            'Liminal state under editorial review with zero dirty cascade.',
    }),
    DEPRECATED_ARCHIVED: Object.freeze({
        standing: 'DEPRECATED_ARCHIVED',
        badgeColor: 'RED',
        cascadeOnEnter: true,
        compileEnforced: false,
        description:
            'Decommissioned canon triggering atomic downstream invalidation.',
    }),
})

/**
 * Resolves the visual badge color for a given standing state.
 */
export function getStandingBadgeColor(standing: TriStateStanding): BadgeColor {
    return STANDING_DEFINITIONS[standing].badgeColor
}

/**
 * Evaluates whether entering this standing state triggers a downstream dirty cascade.
 */
export function isCascadeTriggeringStanding(
    standing: TriStateStanding,
): boolean {
    return STANDING_DEFINITIONS[standing].cascadeOnEnter
}
