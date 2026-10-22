import { describe, it, expect } from 'vitest'
import {
    TriStateStandingEnum,
    validateTriStateStanding,
    isTriStateStanding,
    VALID_TRI_STATE_STANDINGS,
} from '../val/standing.val.js'
import {
    STANDING_DEFINITIONS,
    getStandingBadgeColor,
    isCascadeTriggeringStanding,
} from '../fce/standing.bit.js'
import {
    assertTriStateStanding,
    evaluateStandingTransition,
    assertValidStandingTransition,
    calculateAuditPriorityScore,
} from '../buz/standing.buzz.js'

describe('38.types.unit: Tri-State Standing Enumeration Specification', () => {
    it('POSITIVE: Validates all three canonical standing states', () => {
        for (const standing of VALID_TRI_STATE_STANDINGS) {
            expect(isTriStateStanding(standing)).toBe(true)
            expect(validateTriStateStanding(standing)).toBe(standing)
            expect(TriStateStandingEnum.parse(standing)).toBe(standing)
            expect(() => assertTriStateStanding(standing)).not.toThrow()
        }
    })

    it('POSITIVE: Verifies standing metadata descriptors and badge colors', () => {
        expect(getStandingBadgeColor('ACTIVE_ENDORSED')).toBe('GREEN')
        expect(getStandingBadgeColor('FLAGGED_FOR_REVIEW')).toBe('YELLOW')
        expect(getStandingBadgeColor('DEPRECATED_ARCHIVED')).toBe('RED')

        expect(STANDING_DEFINITIONS.ACTIVE_ENDORSED.compileEnforced).toBe(true)
        expect(STANDING_DEFINITIONS.FLAGGED_FOR_REVIEW.compileEnforced).toBe(
            false,
        )
        expect(STANDING_DEFINITIONS.DEPRECATED_ARCHIVED.compileEnforced).toBe(
            false,
        )
    })

    it('POSITIVE: Enforces the Liminal State Zero-Cascade Guarantee', () => {
        // Transitioning from ACTIVE_ENDORSED to FLAGGED_FOR_REVIEW must NOT trigger dirty cascade
        expect(isCascadeTriggeringStanding('FLAGGED_FOR_REVIEW')).toBe(false)

        const transition = evaluateStandingTransition(
            'ACTIVE_ENDORSED',
            'FLAGGED_FOR_REVIEW',
        )
        expect(transition.allowed).toBe(true)
        expect(transition.triggersCascade).toBe(false)

        // "Still Good" re-affirmation must NOT trigger cascade
        const reaffirm = evaluateStandingTransition(
            'FLAGGED_FOR_REVIEW',
            'ACTIVE_ENDORSED',
        )
        expect(reaffirm.allowed).toBe(true)
        expect(reaffirm.triggersCascade).toBe(false)
    })

    it('POSITIVE: Enforces cascade trigger when archiving facts', () => {
        expect(isCascadeTriggeringStanding('DEPRECATED_ARCHIVED')).toBe(true)

        const archiveFromActive = evaluateStandingTransition(
            'ACTIVE_ENDORSED',
            'DEPRECATED_ARCHIVED',
        )
        expect(archiveFromActive.allowed).toBe(true)
        expect(archiveFromActive.triggersCascade).toBe(true)

        const archiveFromReview = evaluateStandingTransition(
            'FLAGGED_FOR_REVIEW',
            'DEPRECATED_ARCHIVED',
        )
        expect(archiveFromReview.allowed).toBe(true)
        expect(archiveFromReview.triggersCascade).toBe(true)
    })

    it('NEGATIVE CONTROL: Traps invalid standing literals at T_0 ($0.00)', () => {
        const invalidStandings = [
            'PROPOSED',
            'STAGED',
            'DRAFT',
            'active',
            '',
            null,
            undefined,
            100,
        ]
        for (const invalid of invalidStandings) {
            expect(isTriStateStanding(invalid)).toBe(false)
            expect(() => validateTriStateStanding(invalid)).toThrow()
            expect(() => assertTriStateStanding(invalid)).toThrow(
                /STANDING_CONTRACT_BREACH/,
            )
        }
    })

    it('NEGATIVE CONTROL: Traps illegal transition from DEPRECATED to FLAGGED', () => {
        const illegal = evaluateStandingTransition(
            'DEPRECATED_ARCHIVED',
            'FLAGGED_FOR_REVIEW',
        )
        expect(illegal.allowed).toBe(false)
        expect(illegal.errorCode).toBe('ILLEGAL_STANDING_TRANSITION')
        expect(() =>
            assertValidStandingTransition(
                'DEPRECATED_ARCHIVED',
                'FLAGGED_FOR_REVIEW',
            ),
        ).toThrow(/STANDING_TRANSITION_BREACH/)
    })

    it('POSITIVE: Calculates logarithmic review tension score', () => {
        // 0 days should yield 0 score
        expect(calculateAuditPriorityScore(0, 10)).toBe(0)

        // 100 days, 0 dependent scenes: 100 * log10(1) = 0
        expect(calculateAuditPriorityScore(100, 0)).toBe(0)

        // 10 days, 9 dependent scenes: 10 * log10(10) = 10 * 1 = 10.00
        expect(calculateAuditPriorityScore(10, 9)).toBe(10)

        // 30 days, 99 dependent scenes: 30 * log10(100) = 30 * 2 = 60.00
        expect(calculateAuditPriorityScore(30, 99)).toBe(60)
    })
})
