import { describe, it, expect } from 'vitest'
import {
    evaluateLiminalStandingTransition,
    assertLiminalStandingTransition,
} from '../buz/status.buzz.js'

describe('32.status.unit: Zero-Cascade Liminal Standing Validator', () => {
    it('POSITIVE: Verifies Zero-Cascade Guarantee on FLAGGED_FOR_REVIEW transition', () => {
        const result = evaluateLiminalStandingTransition({
            currentStanding: 'ACTIVE_ENDORSED',
            proposedStanding: 'FLAGGED_FOR_REVIEW',
            claimTextMutated: false,
            contentHashMutated: false,
            currentVersion: 1,
            proposedVersion: 1,
        })

        expect(result.valid).toBe(true)
        if (result.valid) {
            expect(result.triggersCascade).toBe(false)
            expect(result.versionIncrementRequired).toBe(false)
            expect(result.transitionCategory).toBe('ENTER_LIMINAL_REVIEW')
        }

        expect(() =>
            assertLiminalStandingTransition({
                currentStanding: 'ACTIVE_ENDORSED',
                proposedStanding: 'FLAGGED_FOR_REVIEW',
                claimTextMutated: false,
                contentHashMutated: false,
                currentVersion: 2,
                proposedVersion: 2,
            }),
        ).not.toThrow()
    })

    it('POSITIVE: Verifies Zero-Cascade on "Still Good" reaffirmation', () => {
        const reaffirm = evaluateLiminalStandingTransition({
            currentStanding: 'FLAGGED_FOR_REVIEW',
            proposedStanding: 'ACTIVE_ENDORSED',
            claimTextMutated: false,
            contentHashMutated: false,
            currentVersion: 1,
            proposedVersion: 1,
        })

        expect(reaffirm.valid).toBe(true)
        if (reaffirm.valid) {
            expect(reaffirm.triggersCascade).toBe(false)
            expect(reaffirm.versionIncrementRequired).toBe(false)
            expect(reaffirm.transitionCategory).toBe('REVERT_STILL_GOOD')
        }
    })

    it('POSITIVE: Enforces version bump and cascade on DEPRECATED_ARCHIVED retirement', () => {
        const deprecate = evaluateLiminalStandingTransition({
            currentStanding: 'FLAGGED_FOR_REVIEW',
            proposedStanding: 'DEPRECATED_ARCHIVED',
            claimTextMutated: false,
            contentHashMutated: false,
            currentVersion: 2,
            proposedVersion: 3,
        })

        expect(deprecate.valid).toBe(true)
        if (deprecate.valid) {
            expect(deprecate.triggersCascade).toBe(true)
            expect(deprecate.versionIncrementRequired).toBe(true)
            expect(deprecate.transitionCategory).toBe('FORMAL_RETIREMENT')
        }
    })

    it('NEGATIVE CONTROL: Traps claim mutation during transition to FLAGGED_FOR_REVIEW', () => {
        const invalidMutation = evaluateLiminalStandingTransition({
            currentStanding: 'ACTIVE_ENDORSED',
            proposedStanding: 'FLAGGED_FOR_REVIEW',
            claimTextMutated: true,
            contentHashMutated: true,
            currentVersion: 1,
            proposedVersion: 1,
        })

        expect(invalidMutation.valid).toBe(false)
        if (!invalidMutation.valid) {
            expect(invalidMutation.errorCode).toBe(
                'LIMINAL_CONTENT_MUTATION_BREACH',
            )
            expect(invalidMutation.message).toContain(
                'Cannot mutate claim_text or content_hash while transitioning to FLAGGED_FOR_REVIEW',
            )
        }

        expect(() =>
            assertLiminalStandingTransition({
                currentStanding: 'ACTIVE_ENDORSED',
                proposedStanding: 'FLAGGED_FOR_REVIEW',
                claimTextMutated: true,
                contentHashMutated: false,
                currentVersion: 1,
                proposedVersion: 1,
            }),
        ).toThrow(/LIMINAL_CONTENT_MUTATION_BREACH/)
    })

    it('NEGATIVE CONTROL: Traps unversioned transition to DEPRECATED_ARCHIVED', () => {
        const unversionedDeprecation = evaluateLiminalStandingTransition({
            currentStanding: 'ACTIVE_ENDORSED',
            proposedStanding: 'DEPRECATED_ARCHIVED',
            claimTextMutated: false,
            contentHashMutated: false,
            currentVersion: 1,
            proposedVersion: 1,
        })

        expect(unversionedDeprecation.valid).toBe(false)
        if (!unversionedDeprecation.valid) {
            expect(unversionedDeprecation.errorCode).toBe(
                'UNVERSIONED_DEPRECATION_BREACH',
            )
            expect(unversionedDeprecation.message).toContain(
                'requires version increment',
            )
        }
    })

    it('NEGATIVE CONTROL: Traps direct transition from DEPRECATED_ARCHIVED to FLAGGED_FOR_REVIEW', () => {
        const illegalTransition = evaluateLiminalStandingTransition({
            currentStanding: 'DEPRECATED_ARCHIVED',
            proposedStanding: 'FLAGGED_FOR_REVIEW',
            claimTextMutated: false,
            contentHashMutated: false,
            currentVersion: 2,
            proposedVersion: 2,
        })

        expect(illegalTransition.valid).toBe(false)
        if (!illegalTransition.valid) {
            expect(illegalTransition.errorCode).toBe(
                'ILLEGAL_ARCHIVED_TRANSITION_BREACH',
            )
            expect(illegalTransition.message).toContain(
                'Archived propositions cannot transition directly to FLAGGED_FOR_REVIEW',
            )
        }
    })
})
