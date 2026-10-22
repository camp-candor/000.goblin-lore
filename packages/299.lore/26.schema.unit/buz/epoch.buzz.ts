import {
    EpochIntegerSchema,
    FactEpochTriadSchema,
    MIN_EPOCH_INTEGER,
    MAX_SAFE_EPOCH_INTEGER,
} from '../val/epoch.val.js'
import type {
    EpochValidationResult,
    FactEpochTriadBit,
} from '../fce/epoch.bit.js'

/**
 * Synchronous in-memory epoch validation engine.
 * Emits strictly 7-bit ASCII diagnostic receipts.
 */
export class EpochGateBuzz {
    /**
     * Fast boolean check avoiding object allocation on high-throughput compilation loops.
     */
    public static isEpochIntegerFast(candidate: unknown): candidate is number {
        return (
            typeof candidate === 'number' &&
            Number.isSafeInteger(candidate) &&
            candidate >= MIN_EPOCH_INTEGER &&
            candidate <= MAX_SAFE_EPOCH_INTEGER
        )
    }

    /**
     * Evaluates candidate epoch value with granular diagnostic error receipts.
     */
    public static validateEpoch(candidate: unknown): EpochValidationResult {
        if (typeof candidate !== 'number') {
            return {
                raw: candidate,
                reason: 'Candidate epoch must be a numeric primitive',
                errorCode: 'INVALID_TYPE',
                isValid: false,
            }
        }

        if (Number.isNaN(candidate) || !Number.isFinite(candidate)) {
            return {
                raw: candidate,
                reason: 'Candidate epoch is NaN or non-finite',
                errorCode: 'FLOAT_PROHIBITED',
                isValid: false,
            }
        }

        if (!Number.isInteger(candidate)) {
            return {
                raw: candidate,
                reason: `Floating-point value (${candidate}) is strictly prohibited`,
                errorCode: 'FLOAT_PROHIBITED',
                isValid: false,
            }
        }

        if (candidate < MIN_EPOCH_INTEGER) {
            return {
                raw: candidate,
                reason: `Negative epoch integer (${candidate}) is prohibited`,
                errorCode: 'NEGATIVE_INTEGER_PROHIBITED',
                isValid: false,
            }
        }

        if (candidate > MAX_SAFE_EPOCH_INTEGER) {
            return {
                raw: candidate,
                reason: `Epoch integer exceeds MAX_SAFE_INTEGER (${candidate})`,
                errorCode: 'UNSAFE_INTEGER_OVERFLOW',
                isValid: false,
            }
        }

        return {
            value: candidate,
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
