import { describe, it, expect } from 'vitest'
import {
    FactScopeEnum,
    validateFactScope,
    isFactScope,
    VALID_FACT_SCOPES,
} from '../val/scope.val.js'
import {
    SCOPE_PREFIX_MAP,
    getScopePrefix,
    inferScopeFromEntityId,
} from '../fce/scope.bit.js'
import {
    assertFactScope,
    validateEntityPrefixAlignment,
    type ScopeValidationFailure,
} from '../buz/scope.buzz.js'

describe('38.types.unit: Fact Scope Enumeration Specification', () => {
    it('POSITIVE: Validates all four canonical fact scopes', () => {
        for (const scope of VALID_FACT_SCOPES) {
            expect(isFactScope(scope)).toBe(true)
            expect(validateFactScope(scope)).toBe(scope)
            expect(FactScopeEnum.parse(scope)).toBe(scope)
            expect(() => assertFactScope(scope)).not.toThrow()
        }
    })

    it('POSITIVE: Maps correct canonical entity prefix for every scope', () => {
        expect(getScopePrefix('CHARACTER')).toBe('char_')
        expect(getScopePrefix('LOCATION')).toBe('loc_')
        expect(getScopePrefix('LOGISTIC')).toBe('item_')
        expect(getScopePrefix('LAW')).toBe('law_')
    })

    it('POSITIVE: Verifies entity ID prefixes matching scope', () => {
        expect(
            validateEntityPrefixAlignment('CHARACTER', 'char_silas_vance'),
        ).toEqual({
            valid: true,
            scope: 'CHARACTER',
        })
        expect(
            validateEntityPrefixAlignment('LOCATION', 'loc_the_warm_pipe'),
        ).toEqual({
            valid: true,
            scope: 'LOCATION',
        })
        expect(
            validateEntityPrefixAlignment('LOGISTIC', 'item_iron_knife'),
        ).toEqual({
            valid: true,
            scope: 'LOGISTIC',
        })
        expect(
            validateEntityPrefixAlignment('LAW', 'law_conservation_of_mass'),
        ).toEqual({
            valid: true,
            scope: 'LAW',
        })
    })

    it('POSITIVE: Infers scope from valid entity ID prefixes', () => {
        expect(inferScopeFromEntityId('char_wart')).toBe('CHARACTER')
        expect(inferScopeFromEntityId('loc_culvert_4')).toBe('LOCATION')
        expect(inferScopeFromEntityId('item_brass_valve')).toBe('LOGISTIC')
        expect(inferScopeFromEntityId('law_entropy')).toBe('LAW')
    })

    it('NEGATIVE CONTROL: Traps invalid scope strings at T_0 ($0.00)', () => {
        const invalidScopes = [
            'FACTION',
            'EVENT',
            'PROJECTION',
            'character',
            'location',
            '',
            null,
            undefined,
            123,
        ]
        for (const invalid of invalidScopes) {
            expect(isFactScope(invalid)).toBe(false)
            expect(() => validateFactScope(invalid)).toThrow()
            expect(() => assertFactScope(invalid)).toThrow(
                /SCOPE_CONTRACT_BREACH/,
            )
        }
    })

    it('NEGATIVE CONTROL: Traps scope prefix mismatches', () => {
        const mismatch = validateEntityPrefixAlignment(
            'LOGISTIC',
            'char_bog_limp',
        )
        expect(mismatch.valid).toBe(false)
        if (!mismatch.valid) {
            const fail = mismatch as ScopeValidationFailure
            expect(fail.errorCode).toBe('PREFIX_SCOPE_MISMATCH')
            expect(fail.message).toContain("Mandatory prefix: 'item_'")
        }
    })

    it('NEGATIVE CONTROL: Traps un-inferrable entity IDs', () => {
        expect(() => inferScopeFromEntityId('unknown_id_123')).toThrow(
            /UNKNOWN_ENTITY_PREFIX/,
        )
        expect(() => inferScopeFromEntityId('bog_without_prefix')).toThrow(
            /UNKNOWN_ENTITY_PREFIX/,
        )
    })
})
