import {
    VersionInteger,
    isValidVersionInteger,
    validateVersionInteger,
} from '../val/sequence.val.js'
import SequenceBit, {
    SequenceStepBit,
    SequenceVerificationResult,
} from '../fce/sequence.bit.js'
import { SequenceModel } from '../sequence.model.js'
import State from '../../99.core/state.js'

export const initSequence = (
    cpy: SequenceModel,
    bal: SequenceBit,
    ste: State,
) => {
    debugger
    return cpy
}

export const updateSequence = (
    cpy: SequenceModel,
    bal: SequenceBit,
    ste: State,
) => {
    return cpy
}

/**
 * Computes the deterministic next sequential version integer.
 * Advances version monotonically: v_{n+1} = v_n + 1
 */
export function getNextSequentialVersion(
    currentVersion: VersionInteger,
): VersionInteger {
    const validated = validateVersionInteger(currentVersion)
    return (validated + 1) as VersionInteger
}

/**
 * Evaluates whether a proposed version transition satisfies strict sequential progression.
 *
 * Invariants:
 * 1. If claim_text or content_hash mutated: proposedVersion MUST equal currentVersion + 1.
 * 2. If claim_text and content_hash did NOT mutate: proposedVersion MAY equal currentVersion.
 * 3. proposedVersion < currentVersion is strictly forbidden (Regression Breach).
 * 4. proposedVersion > currentVersion + 1 is strictly forbidden (Gap Breach).
 */
export function evaluateVersionProgression(
    step: SequenceStepBit,
): SequenceVerificationResult {
    if (
        !isValidVersionInteger(step.currentVersion) ||
        !isValidVersionInteger(step.proposedVersion)
    ) {
        return {
            valid: false,
            errorCode: 'INVALID_VERSION_INTEGER',
            message:
                'Both currentVersion and proposedVersion must be positive safe integers (min 1).',
            currentVersion: Number(step.currentVersion),
            proposedVersion: Number(step.proposedVersion),
        }
    }

    const current = step.currentVersion
    const proposed = step.proposedVersion
    const isDataMutated = step.claimMutated || step.hashMutated

    // Rule 1: Regression check
    if (proposed < current) {
        return {
            valid: false,
            errorCode: 'MONOTONIC_VERSION_REGRESSION_BREACH',
            message: `Version regression prohibited. Proposed version ${proposed} is less than current version ${current}.`,
            currentVersion: current,
            proposedVersion: proposed,
        }
    }

    // Rule 2: Mutation requires increment
    if (isDataMutated && proposed === current) {
        return {
            valid: false,
            errorCode: 'MUTATION_WITHOUT_VERSION_BUMP_BREACH',
            message: `Claim or hash mutated without incrementing version. Current: ${current}, Proposed: ${proposed}.`,
            currentVersion: current,
            proposedVersion: proposed,
        }
    }

    // Rule 3: Sequence gap check
    if (proposed > current + 1) {
        return {
            valid: false,
            errorCode: 'MONOTONIC_SEQUENCE_GAP_BREACH',
            message: `Sequence gap detected. Proposed version ${proposed} exceeds next expected contiguous version ${current + 1}.`,
            currentVersion: current,
            proposedVersion: proposed,
        }
    }

    // Rule 4: Idempotent maintain
    if (!isDataMutated && proposed === current) {
        return {
            valid: true,
            previousVersion: current,
            nextVersion: proposed,
            stepType: 'IDEMPOTENT_MAINTAINED',
        }
    }

    // Rule 5: Valid contiguous increment
    return {
        valid: true,
        previousVersion: current,
        nextVersion: proposed,
        stepType: 'INCREMENT_CONTIGUOUS',
    }
}

/**
 * Hard fail-closed assertion for sequential version increments.
 * Throws Error immediately if an illegal transition is attempted at Stage T0 ($0.00).
 */
export function assertSequentialVersionIncrement(step: SequenceStepBit): void {
    const result = evaluateVersionProgression(step)
    if (!result.valid) {
        throw new Error(
            `[SEQUENCE_INCREMENT_BREACH] ${result.errorCode}: ${result.message}`,
        )
    }
}
