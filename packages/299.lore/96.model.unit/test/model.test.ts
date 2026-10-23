import { describe, it, expect, beforeEach } from 'vitest'
import {
    registerFactNode,
    assertRegisterFactNode,
    getFactNode,
    hasFactNode,
    getFactsByScope,
    getFactsByAuthority,
    getRegistryStats,
    clearRegistry,
    getLastSchemaErrors,
} from '../buz/model.buzz.js'
import { computeFactContentHash } from '../../41.canon.unit/buz/canonHash.buzz.js'

describe('96.model.unit: Deep-Frozen Fact Registry Store', () => {
    const claimText = 'Bog right arm is immobilized.'
    const hash = computeFactContentHash('CHARACTER', claimText)

    const sampleFact = {
        id: 'char_bog_arm',
        claim_text: claimText,
        scope: 'CHARACTER' as const,
        authority_level: 'CANON' as const,
        standing: 'ACTIVE_ENDORSED' as const,
        version: 1,
        content_hash: hash,
        author: 'Elena',
        created_at_ms: 1700000000000,
        last_edited_at_ms: 1700000000000,
    }

    beforeEach(() => {
        clearRegistry()
    })

    it('POSITIVE: Registers and retrieves a valid fact node with O(1) lookup', () => {
        const regResult = registerFactNode(sampleFact)
        expect(regResult.valid).toBe(true)

        expect(hasFactNode('char_bog_arm')).toBe(true)
        const retrieved = getFactNode('char_bog_arm')
        expect(retrieved).toBeDefined()
        expect(retrieved?.id).toBe('char_bog_arm')
        expect(retrieved?.version).toBe(1)
    })

    it('POSITIVE: Indexes facts by scope and authority level', () => {
        assertRegisterFactNode(sampleFact)

        const charFacts = getFactsByScope('CHARACTER')
        expect(charFacts.length).toBe(1)
        expect(charFacts[0].id).toBe('char_bog_arm')

        const canonFacts = getFactsByAuthority('CANON')
        expect(canonFacts.length).toBe(1)
        expect(canonFacts[0].id).toBe('char_bog_arm')

        const emptyScope = getFactsByScope('LOCATION')
        expect(emptyScope.length).toBe(0)
    })

    it('POSITIVE: Computes live registry statistics', () => {
        assertRegisterFactNode(sampleFact)
        const stats = getRegistryStats()
        expect(stats.totalFacts).toBe(1)
        expect(stats.scopeCounts.CHARACTER).toBe(1)
        expect(stats.authorityCounts.CANON).toBe(1)
        expect(stats.standingCounts.ACTIVE_ENDORSED).toBe(1)
        expect(stats.errorLogCount).toBe(0)
    })

    it('NEGATIVE CONTROL: Traps in-memory property mutations with TypeError at T_0 ($0.00)', () => {
        assertRegisterFactNode(sampleFact)
        const retrieved = getFactNode('char_bog_arm')
        expect(retrieved).toBeDefined()

        // Attempting to mutate version must throw TypeError
        expect(() => {
            ;(retrieved as any).version = 99
        }).toThrow(TypeError)

        // Attempting to mutate claim text must throw TypeError
        expect(() => {
            ;(retrieved as any).claim_text = 'Tampered text'
        }).toThrow(TypeError)

        // Attempting to add an arbitrary property must throw TypeError
        expect(() => {
            ;(retrieved as any).rogue_property = 'illegal'
        }).toThrow(TypeError)
    })

    it('NEGATIVE CONTROL: Traps schema validation failure and logs error', () => {
        const invalidFact = {
            ...sampleFact,
            id: '', // Empty ID
            version: 0, // Invalid version
        }

        const result = registerFactNode(invalidFact)
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.errorCode).toBe('SCHEMA_VALIDATION_ERROR')
        }

        const errors = getLastSchemaErrors()
        expect(errors.length).toBe(1)
        expect(errors[0]).toContain('Fact ID must not be empty')

        expect(() => assertRegisterFactNode(invalidFact)).toThrow(
            /REGISTRY_STORE_BREACH/,
        )
    })
})
