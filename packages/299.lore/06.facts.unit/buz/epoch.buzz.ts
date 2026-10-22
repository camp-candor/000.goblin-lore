import {
    isNonNegativeSafeInteger,
    EpochIntegerSchema,
    FactEpochTriadSchema,
} from '../val/epoch.val.js'
import type {
    ValidatedEpochIntegerBit,
    EpochValidationResult,
    FactEpochTriadBit,
} from '../fce/epoch.bit.js'

/**
 * Synchronous in-memory epoch integer enforcer and temporal sequence gate.
 * Emits strictly 7-bit ASCII receipts. Operates at Stage T0 = $0.00.
 */
export class EpochGateBuzz {
    /**
     * Fast sub-microsecond non-negative safe integer check.
     */
    public static isEpochIntegerFast(candidate: unknown): boolean {
        return isNonNegativeSafeInteger(candidate)
    }

    /**
     * Evaluates a candidate integer timestamp against strict integer invariants.
     */
    public static validateEpoch(candidate: unknown): EpochValidationResult {
        if (typeof candidate !== 'number') {
            return {
                raw: candidate,
                reason: 'Epoch value must be a number primitive',
                errorCode: 'INVALID_TYPE',
                isValid: false,
            }
        }

        if (
            !Number.isFinite(candidate) ||
            Math.floor(candidate) !== candidate
        ) {
            return {
                raw: candidate,
                reason: `Floating-point or non-finite timestamp prohibited: ${candidate}`,
                errorCode: 'FLOAT_PROHIBITED',
                isValid: false,
            }
        }

        if (candidate < 0) {
            return {
                raw: candidate,
                reason: `Negative epoch integer prohibited: ${candidate}`,
                errorCode: 'NEGATIVE_INTEGER_PROHIBITED',
                isValid: false,
            }
        }

        if (candidate > Number.MAX_SAFE_INTEGER) {
            return {
                raw: candidate,
                reason: `Epoch exceeds Number.MAX_SAFE_INTEGER: ${candidate}`,
                errorCode: 'UNSAFE_INTEGER_OVERFLOW',
                isValid: false,
            }
        }

        const parseResult = EpochIntegerSchema.safeParse(candidate)
        if (!parseResult.success) {
            const issue = parseResult.error.issues[0]
            return {
                raw: candidate,
                reason: issue ? issue.message : 'Unknown epoch integer failure',
                errorCode: 'INVALID_TYPE',
                isValid: false,
            }
        }

        return {
            value: parseResult.data,
            isSafeInteger: true,
            isNonNegative: true,
            isValid: true,
        }
    }

    /**
     * Asserts whether a candidate epoch integer is valid, throwing formatted Error on failure.
     */
    public static assertEpochInteger(
        candidate: unknown,
    ): asserts candidate is number {
        const result = this.validateEpoch(candidate)
        if (!result.isValid) {
            throw new Error(
                `[EPOCH_INTEGER_BREACH] Validation failed: ${result.reason} (code: ${result.errorCode})`,
            )
        }
    }

    /**
     * Validates a complete fact epoch triad and enforces causal temporal sequencing.
     */
    public static validateEpochTriad(triad: unknown): FactEpochTriadBit {
        const parseResult = FactEpochTriadSchema.safeParse(triad)
        if (!parseResult.success) {
            const issue = parseResult.error.issues[0]
            throw new Error(
                `[EPOCH_TRIAD_BREACH] Temporal invariant failed: ${issue ? issue.message : 'Unknown validation failure'}`,
            )
        }

        return {
            createdAtEpoch: parseResult.data.created_at_epoch,
            lastMutatedEpoch: parseResult.data.last_mutated_epoch,
            lastReconsideredEpoch: parseResult.data.last_reconsidered_epoch,
        }
    }
}
