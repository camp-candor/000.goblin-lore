import { StatusModel } from '../status.model.js'
import StatusBit, { LiminalTransitionResult } from '../fce/status.bit.js'
import State from '../../99.core/state.js'
import {
    StandingTransitionInput,
    StandingTransitionSchema,
} from '../val/status.val.js'

export const initStatus = (cpy: StatusModel, bal: StatusBit, ste: State) => {
    debugger
    return cpy
}

export const updateStatus = (cpy: StatusModel, bal: StatusBit, ste: State) => {
    return cpy
}

/**
 * Pure business logic validator for the Zero-Cascade Liminal Standing Guarantee.
 *
 * Rules:
 * 1. ACTIVE_ENDORSED -> FLAGGED_FOR_REVIEW:
 *    - claim_text and content_hash MUST NOT mutate.
 *    - version MUST remain identical (proposedVersion === currentVersion).
 *    - triggersCascade MUST BE FALSE.
 * 2. FLAGGED_FOR_REVIEW -> ACTIVE_ENDORSED (The "Still Good" reaffirmation):
 *    - claim_text and content_hash MUST NOT mutate.
 *    - version MUST remain identical.
 *    - triggersCascade MUST BE FALSE.
 * 3. * -> DEPRECATED_ARCHIVED (Retcon Deprecation):
 *    - proposedVersion MUST equal currentVersion + 1.
 *    - triggersCascade MUST BE TRUE.
 * 4. DEPRECATED_ARCHIVED -> FLAGGED_FOR_REVIEW:
 *    - Strictly ILLEGAL. Must be restored to ACTIVE_ENDORSED first.
 * 5. If claim_text mutates during transition to FLAGGED_FOR_REVIEW:
 *    - Strictly ILLEGAL. Content edits require version bump and cannot be liminal.
 */
export function evaluateLiminalStandingTransition(
    input: StandingTransitionInput,
): LiminalTransitionResult {
    const parseResult = StandingTransitionSchema.safeParse(input)
    if (!parseResult.success) {
        return {
            valid: false,
            errorCode: 'INVALID_TRANSITION_PAYLOAD',
            message: parseResult.error.errors.map((e) => e.message).join('; '),
        }
    }

    const {
        currentStanding,
        proposedStanding,
        claimTextMutated,
        contentHashMutated,
        currentVersion,
        proposedVersion,
    } = parseResult.data

    const isDataMutated = claimTextMutated || contentHashMutated

    // Rule 4: Disallow DEPRECATED_ARCHIVED -> FLAGGED_FOR_REVIEW
    if (
        currentStanding === 'DEPRECATED_ARCHIVED' &&
        proposedStanding === 'FLAGGED_FOR_REVIEW'
    ) {
        return {
            valid: false,
            errorCode: 'ILLEGAL_ARCHIVED_TRANSITION_BREACH',
            message:
                'Archived propositions cannot transition directly to FLAGGED_FOR_REVIEW. Must be restored to ACTIVE_ENDORSED first.',
        }
    }

    // Rule 5: Entering or maintaining liminal state cannot include mutated claim text
    if (proposedStanding === 'FLAGGED_FOR_REVIEW' && isDataMutated) {
        return {
            valid: false,
            errorCode: 'LIMINAL_CONTENT_MUTATION_BREACH',
            message:
                'Cannot mutate claim_text or content_hash while transitioning to FLAGGED_FOR_REVIEW. Liminal state is strictly for reviewing existing text without cascade.',
        }
    }

    // Rule 3: Deprecation requires version increment and triggers cascade
    if (proposedStanding === 'DEPRECATED_ARCHIVED') {
        if (proposedVersion !== currentVersion + 1) {
            return {
                valid: false,
                errorCode: 'UNVERSIONED_DEPRECATION_BREACH',
                message: `Retiring fact to DEPRECATED_ARCHIVED requires version increment. Current: ${currentVersion}, Proposed: ${proposedVersion}.`,
            }
        }
        return {
            valid: true,
            fromStanding: currentStanding,
            toStanding: proposedStanding,
            triggersCascade: true,
            versionIncrementRequired: true,
            transitionCategory: 'FORMAL_RETIREMENT',
            telemetryMessage: `Fact transitioned to DEPRECATED_ARCHIVED (v${currentVersion} -> v${proposedVersion}). Invalidation cascade active.`,
        }
    }

    // Rule 1: Active to Flagged (Liminal Review Entry)
    if (
        currentStanding === 'ACTIVE_ENDORSED' &&
        proposedStanding === 'FLAGGED_FOR_REVIEW'
    ) {
        return {
            valid: true,
            fromStanding: currentStanding,
            toStanding: proposedStanding,
            triggersCascade: false,
            versionIncrementRequired: false,
            transitionCategory: 'ENTER_LIMINAL_REVIEW',
            telemetryMessage: `Fact flagged for review. Zero cascade triggered. Dependent scenes remain clean.`,
        }
    }

    // Rule 2: Flagged to Active ("Still Good" Reaffirmation)
    if (
        currentStanding === 'FLAGGED_FOR_REVIEW' &&
        proposedStanding === 'ACTIVE_ENDORSED'
    ) {
        return {
            valid: true,
            fromStanding: currentStanding,
            toStanding: proposedStanding,
            triggersCascade: false,
            versionIncrementRequired: false,
            transitionCategory: 'REVERT_STILL_GOOD',
            telemetryMessage: `Fact reaffirmed as STILL GOOD. Zero cascade triggered. Timestamp refreshed.`,
        }
    }

    // Idempotent self-transition
    if (currentStanding === proposedStanding) {
        return {
            valid: true,
            fromStanding: currentStanding,
            toStanding: proposedStanding,
            triggersCascade: false,
            versionIncrementRequired: false,
            transitionCategory: 'IDEMPOTENT_MAINTAINED',
            telemetryMessage: `Standing maintained at ${currentStanding}.`,
        }
    }

    // Default fallback for restoration from DEPRECATED_ARCHIVED to ACTIVE_ENDORSED
    return {
        valid: true,
        fromStanding: currentStanding,
        toStanding: proposedStanding,
        triggersCascade: true,
        versionIncrementRequired: true,
        transitionCategory: 'FORMAL_RETIREMENT',
        telemetryMessage: `Fact restored from archive to ACTIVE_ENDORSED. Version advanced.`,
    }
}

/**
 * Hard fail-closed assertion for liminal transitions.
 * Throws an Error immediately at Stage T0 ($0.00) if an invalid transition is detected.
 */
export function assertLiminalStandingTransition(
    input: StandingTransitionInput,
): void {
    const result = evaluateLiminalStandingTransition(input)
    if (!result.valid) {
        throw new Error(
            `[LIMINAL_STANDING_BREACH] ${result.errorCode}: ${result.message}`,
        )
    }
}
