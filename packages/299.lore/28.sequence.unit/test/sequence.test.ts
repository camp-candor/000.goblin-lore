import { describe, it, expect } from 'vitest'
import {
    VersionIntegerSchema,
    isValidVersionInteger,
    validateVersionInteger,
} from '../val/sequence.val.js'
import {
    getNextSequentialVersion,
    evaluateVersionProgression,
    assertSequentialVersionIncrement,
} from '../buz/sequence.buzz.js'

describe('28.sequence.unit: Sequential Version Increment Verifier', () => {
    it('POSITIVE: Validates positive safe integer versions', () => {
        expect(isValidVersionInteger(1)).toBe(true)
        expect(isValidVersionInteger(42)).toBe(true)
        expect(isValidVersionInteger(1000)).toBe(true)
        expect(validateVersionInteger(1)).toBe(1)
        expect(VersionIntegerSchema.parse(5)).toBe(5)
    })

    it('POSITIVE: Computes next contiguous sequential version', () => {
        expect(getNextSequentialVersion(1)).toBe(2)
        expect(getNextSequentialVersion(2)).toBe(3)
        expect(getNextSequentialVersion(99)).toBe(100)
    })

    it('POSITIVE: Permits valid contiguous version increment on mutation', () => {
        const result = evaluateVersionProgression({
            currentVersion: 1,
            proposedVersion: 2,
            claimMutated: true,
            hashMutated: true,
        })

        expect(result.valid).toBe(true)
        if (result.valid) {
            expect(result.stepType).toBe('INCREMENT_CONTIGUOUS')
            expect(result.previousVersion).toBe(1)
            expect(result.nextVersion).toBe(2)
        }

        expect(() =>
            assertSequentialVersionIncrement({
                currentVersion: 4,
                proposedVersion: 5,
                claimMutated: true,
                hashMutated: false,
            }),
        ).not.toThrow()
    })

    it('POSITIVE: Permits idempotent same-version transition when unmutated', () => {
        const result = evaluateVersionProgression({
            currentVersion: 3,
            proposedVersion: 3,
            claimMutated: false,
            hashMutated: false,
        })

        expect(result.valid).toBe(true)
        if (result.valid) {
            expect(result.stepType).toBe('IDEMPOTENT_MAINTAINED')
            expect(result.previousVersion).toBe(3)
            expect(result.nextVersion).toBe(3)
        }
    })

    it('NEGATIVE CONTROL: Traps non-integer and non-positive versions at T_0 ($0.00)', () => {
        const invalidVersions = [
            0,
            -1,
            -99,
            1.5,
            3.14159,
            NaN,
            Infinity,
            null,
            undefined,
            '1',
            'v2',
        ]
        for (const v of invalidVersions) {
            expect(isValidVersionInteger(v)).toBe(false)
            expect(() => validateVersionInteger(v)).toThrow()
        }
    })

    it('NEGATIVE CONTROL: Traps version regression attempts at T_0 ($0.00)', () => {
        const regression = evaluateVersionProgression({
            currentVersion: 5,
            proposedVersion: 4,
            claimMutated: true,
            hashMutated: true,
        })

        expect(regression.valid).toBe(false)
        if (!regression.valid) {
            expect(regression.errorCode).toBe(
                'MONOTONIC_VERSION_REGRESSION_BREACH',
            )
            expect(regression.message).toContain(
                'Proposed version 4 is less than current version 5',
            )
        }

        expect(() =>
            assertSequentialVersionIncrement({
                currentVersion: 2,
                proposedVersion: 1,
                claimMutated: false,
                hashMutated: false,
            }),
        ).toThrow(/MONOTONIC_VERSION_REGRESSION_BREACH/)
    })

    it('NEGATIVE CONTROL: Traps mutations without version increments at T_0 ($0.00)', () => {
        const unversionedMutation = evaluateVersionProgression({
            currentVersion: 3,
            proposedVersion: 3,
            claimMutated: true,
            hashMutated: true,
        })

        expect(unversionedMutation.valid).toBe(false)
        if (!unversionedMutation.valid) {
            expect(unversionedMutation.errorCode).toBe(
                'MUTATION_WITHOUT_VERSION_BUMP_BREACH',
            )
            expect(unversionedMutation.message).toContain(
                'Claim or hash mutated without incrementing version',
            )
        }

        expect(() =>
            assertSequentialVersionIncrement({
                currentVersion: 3,
                proposedVersion: 3,
                claimMutated: true,
                hashMutated: false,
            }),
        ).toThrow(/MUTATION_WITHOUT_VERSION_BUMP_BREACH/)
    })

    it('NEGATIVE CONTROL: Traps sequence gap skips at T_0 ($0.00)', () => {
        const gapSkip = evaluateVersionProgression({
            currentVersion: 2,
            proposedVersion: 7,
            claimMutated: true,
            hashMutated: true,
        })

        expect(gapSkip.valid).toBe(false)
        if (!gapSkip.valid) {
            expect(gapSkip.errorCode).toBe('MONOTONIC_SEQUENCE_GAP_BREACH')
            expect(gapSkip.message).toContain(
                'Proposed version 7 exceeds next expected contiguous version 3',
            )
        }

        expect(() =>
            assertSequentialVersionIncrement({
                currentVersion: 1,
                proposedVersion: 3,
                claimMutated: true,
                hashMutated: true,
            }),
        ).toThrow(/MONOTONIC_SEQUENCE_GAP_BREACH/)
    })
})
