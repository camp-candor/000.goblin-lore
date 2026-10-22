import {
    TriStateStanding,
    TriStateStandingEnum,
    isTriStateStanding,
} from '../val/standing.val.js'
import { STANDING_DEFINITIONS } from '../fce/standing.bit.js'

export interface StandingTransitionResult {
    readonly allowed: boolean
    readonly fromStanding: TriStateStanding
    readonly toStanding: TriStateStanding
    readonly triggersCascade: boolean
    readonly errorCode?:
        'ILLEGAL_STANDING_TRANSITION' | 'INVALID_STANDING_LITERAL'
    readonly message?: string
}

/**
 * Synchronous in-memory standing assertion.
 * Halts execution immediately if an invalid standing is encountered at Stage T0 ($0.00).
 */
export function assertTriStateStanding(candidate: unknown): TriStateStanding {
    const result = TriStateStandingEnum.safeParse(candidate)
    if (!result.success) {
        const errorDetails = result.error.errors
            .map((e) => e.message)
            .join('; ')
        throw new Error(
            `[STANDING_CONTRACT_BREACH] Invalid TriStateStanding: '${String(candidate)}'. ${errorDetails}`,
        )
    }
    return result.data
}

/**
 * Evaluates the validity and cascading impact of a lifecycle standing transition.
 *
 * Transition Rules:
 * - ACTIVE_ENDORSED -> FLAGGED_FOR_REVIEW (Allowed, cascade: false) [Liminal State Guarantee]
 * - ACTIVE_ENDORSED -> DEPRECATED_ARCHIVED (Allowed, cascade: true)  [Retcon Deprecation]
 * - FLAGGED_FOR_REVIEW -> ACTIVE_ENDORSED (Allowed, cascade: false) [Still Good Protocol]
 * - FLAGGED_FOR_REVIEW -> DEPRECATED_ARCHIVED (Allowed, cascade: true) [Retcon Confirmation]
 * - DEPRECATED_ARCHIVED -> ACTIVE_ENDORSED (Allowed with cascade: true) [Restoration]
 * - DEPRECATED_ARCHIVED -> FLAGGED_FOR_REVIEW (Disallowed: Must be restored to ACTIVE first)
 */
export function evaluateStandingTransition(
    current: unknown,
    target: unknown,
): StandingTransitionResult {
    if (!isTriStateStanding(current) || !isTriStateStanding(target)) {
        return {
            allowed: false,
            fromStanding: (isTriStateStanding(current)
                ? current
                : 'ACTIVE_ENDORSED') as TriStateStanding,
            toStanding: (isTriStateStanding(target)
                ? target
                : 'ACTIVE_ENDORSED') as TriStateStanding,
            triggersCascade: false,
            errorCode: 'INVALID_STANDING_LITERAL',
            message:
                'One or both standing arguments are not valid TriStateStanding literals.',
        }
    }

    // Idempotent self-transitions
    if (current === target) {
        return {
            allowed: true,
            fromStanding: current,
            toStanding: target,
            triggersCascade: false,
        }
    }

    // Disallow direct transition from DEPRECATED_ARCHIVED to FLAGGED_FOR_REVIEW
    if (current === 'DEPRECATED_ARCHIVED' && target === 'FLAGGED_FOR_REVIEW') {
        return {
            allowed: false,
            fromStanding: current,
            toStanding: target,
            triggersCascade: false,
            errorCode: 'ILLEGAL_STANDING_TRANSITION',
            message:
                'Archived facts cannot be transitioned directly to FLAGGED_FOR_REVIEW. Restore to ACTIVE_ENDORSED first.',
        }
    }

    // Invalidation cascade triggers when entering DEPRECATED_ARCHIVED or restoring from DEPRECATED_ARCHIVED
    const triggersCascade =
        STANDING_DEFINITIONS[target].cascadeOnEnter ||
        current === 'DEPRECATED_ARCHIVED'

    return {
        allowed: true,
        fromStanding: current,
        toStanding: target,
        triggersCascade,
    }
}

/**
 * Hard fail-closed assertion for lifecycle transitions.
 * Throws Error immediately if an illegal transition is attempted at Stage T0 ($0.00).
 */
export function assertValidStandingTransition(
    current: TriStateStanding,
    target: TriStateStanding,
): void {
    const result = evaluateStandingTransition(current, target)
    if (!result.allowed) {
        throw new Error(`[STANDING_TRANSITION_BREACH] ${result.message}`)
    }
}

/**
 * Calculates logarithmic review tension score for fact nodes:
 * Score = DaysSinceReconsideration * log10(DownstreamDependentScenes + 1)
 * Rounded to 2 decimal places using deterministic math.
 */
export function calculateAuditPriorityScore(
    daysSinceReconsideration: number,
    downstreamDependentScenes: number,
): number {
    const safeDays = Math.max(0, Math.floor(daysSinceReconsideration))
    const safeScenes = Math.max(0, Math.floor(downstreamDependentScenes))
    const rawScore = safeDays * Math.log10(safeScenes + 1)
    return Math.round(rawScore * 100) / 100
}
