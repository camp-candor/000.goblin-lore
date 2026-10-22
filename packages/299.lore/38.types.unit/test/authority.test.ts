import { describe, it, expect } from 'vitest'
import {
    AuthorityLevelEnum,
    validateAuthorityLevel,
    isAuthorityLevel,
    VALID_AUTHORITY_LEVELS,
} from '../val/authority.val.js'
import {
    AUTHORITY_RANK_MAP,
    AUTHORITY_DEFINITIONS,
} from '../fce/authority.bit.js'
import {
    assertAuthorityLevel,
    getAuthorityRank,
    canOverwriteAuthority,
    evaluatePrecedence,
    assertAuthorityPrecedence,
} from '../buz/authority.buzz.js'

describe('38.types.unit: Authority Level Stratification Specification', () => {
    it('POSITIVE: Validates all six canonical authority levels', () => {
        for (const level of VALID_AUTHORITY_LEVELS) {
            expect(isAuthorityLevel(level)).toBe(true)
            expect(validateAuthorityLevel(level)).toBe(level)
            expect(AuthorityLevelEnum.parse(level)).toBe(level)
            expect(() => assertAuthorityLevel(level)).not.toThrow()
        }
    })

    it('POSITIVE: Validates strict descending ordinal rank hierarchy', () => {
        expect(AUTHORITY_RANK_MAP.AXIOM).toBe(600)
        expect(AUTHORITY_RANK_MAP.CANON).toBe(500)
        expect(AUTHORITY_RANK_MAP.EVENT).toBe(400)
        expect(AUTHORITY_RANK_MAP.RUNTIME_STATE).toBe(300)
        expect(AUTHORITY_RANK_MAP.PROJECTION).toBe(200)
        expect(AUTHORITY_RANK_MAP.SPECULATION).toBe(100)

        expect(getAuthorityRank('AXIOM')).toBeGreaterThan(
            getAuthorityRank('CANON'),
        )
        expect(getAuthorityRank('CANON')).toBeGreaterThan(
            getAuthorityRank('EVENT'),
        )
        expect(getAuthorityRank('EVENT')).toBeGreaterThan(
            getAuthorityRank('RUNTIME_STATE'),
        )
        expect(getAuthorityRank('RUNTIME_STATE')).toBeGreaterThan(
            getAuthorityRank('PROJECTION'),
        )
        expect(getAuthorityRank('PROJECTION')).toBeGreaterThan(
            getAuthorityRank('SPECULATION'),
        )
    })

    it('POSITIVE: Allows overwrite when incoming rank is equal or greater', () => {
        expect(canOverwriteAuthority('CANON', 'CANON')).toBe(true)
        expect(canOverwriteAuthority('AXIOM', 'CANON')).toBe(true)
        expect(canOverwriteAuthority('CANON', 'EVENT')).toBe(true)
        expect(canOverwriteAuthority('EVENT', 'RUNTIME_STATE')).toBe(true)
        expect(canOverwriteAuthority('RUNTIME_STATE', 'PROJECTION')).toBe(true)
        expect(canOverwriteAuthority('PROJECTION', 'SPECULATION')).toBe(true)

        expect(() => assertAuthorityPrecedence('AXIOM', 'CANON')).not.toThrow()
        expect(() => assertAuthorityPrecedence('CANON', 'CANON')).not.toThrow()
    })

    it('NEGATIVE CONTROL: Traps invalid authority level literals at T_0 ($0.00)', () => {
        const invalidLevels = [
            'GOSSIP',
            'PROMPT',
            'SYSTEM',
            'canon',
            'axiom',
            '',
            null,
            undefined,
            42,
        ]
        for (const invalid of invalidLevels) {
            expect(isAuthorityLevel(invalid)).toBe(false)
            expect(() => validateAuthorityLevel(invalid)).toThrow()
            expect(() => assertAuthorityLevel(invalid)).toThrow(
                /AUTHORITY_CONTRACT_BREACH/,
            )
        }
    })

    it('NEGATIVE CONTROL: Traps authority demotion attempts at T_0 ($0.00)', () => {
        // Attempting to overwrite CANON with SPECULATION must fail closed
        expect(canOverwriteAuthority('SPECULATION', 'CANON')).toBe(false)
        expect(() => assertAuthorityPrecedence('SPECULATION', 'CANON')).toThrow(
            /AUTHORITY_PRECEDENCE_BREACH/,
        )

        // Attempting to overwrite AXIOM with RUNTIME_STATE must fail closed
        expect(canOverwriteAuthority('RUNTIME_STATE', 'AXIOM')).toBe(false)
        expect(() =>
            assertAuthorityPrecedence('RUNTIME_STATE', 'AXIOM'),
        ).toThrow(/AUTHORITY_PRECEDENCE_BREACH/)

        // Detailed diagnostic check
        const breach = evaluatePrecedence('SPECULATION', 'CANON')
        expect(breach.allowed).toBe(false)
        expect(breach.errorCode).toBe('AUTHORITY_DEMOTION_BREACH')
        expect(breach.message).toContain(
            "Incoming 'SPECULATION' (rank 100) cannot overwrite existing 'CANON' (rank 500)",
        )
    })

    it('POSITIVE: Verifies static authority descriptors for TUI displays', () => {
        expect(AUTHORITY_DEFINITIONS.AXIOM.writableBy).toBe('HUMAN_GIT_COMMIT')
        expect(AUTHORITY_DEFINITIONS.CANON.writableBy).toBe('HUMAN_GIT_COMMIT')
        expect(AUTHORITY_DEFINITIONS.EVENT.writableBy).toBe(
            'SIMULATION_REDUCER',
        )
        expect(AUTHORITY_DEFINITIONS.RUNTIME_STATE.writableBy).toBe(
            'SIMULATION_REDUCER',
        )
        expect(AUTHORITY_DEFINITIONS.PROJECTION.writableBy).toBe(
            'PROJECTION_ENGINE',
        )
        expect(AUTHORITY_DEFINITIONS.SPECULATION.writableBy).toBe(
            'UNTRUSTED_INFERENCE',
        )
    })
})
