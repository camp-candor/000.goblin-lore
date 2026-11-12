import { describe, it, expect } from 'vitest'
import {
    EpistemologicalStandingEnum,
    VALID_EPISTEMOLOGICAL_STANDINGS,
    isEpistemologicalStanding,
    getStandingMetadata,
    CanonFactStandingSchema,
    type CanonFactStanding,
} from '../fce/standing.schema.js'

describe('41.canon.unit :: Tri-State Epistemological Standing Schema Contract', () => {
    const validStandingRecord: CanonFactStanding = {
        fact_id: 'fact_wart_arm_amputation',
        entity_id: 'char_wart',
        standing: 'ACTIVE_ENDORSED',
        in_degree_count: 12,
        days_since_reconsideration: 30,
        last_reviewed_epoch: 100,
        review_note:
            'Baseline physical amputation fact affirmed at season start.',
    }

    it('validates a compliant CanonFactStanding record', () => {
        const result = CanonFactStandingSchema.safeParse(validStandingRecord)
        expect(result.success).toBe(true)
    })

    it('verifies metadata definitions for all 3 epistemological states', () => {
        expect(VALID_EPISTEMOLOGICAL_STANDINGS).toHaveLength(3)

        const activeMeta = getStandingMetadata('ACTIVE_ENDORSED')
        expect(activeMeta.badge).toBe('GREEN')
        expect(activeMeta.cascadeOnEnter).toBe(false)
        expect(activeMeta.compileEnforced).toBe(true)

        const flaggedMeta = getStandingMetadata('FLAGGED_FOR_REVIEW')
        expect(flaggedMeta.badge).toBe('YELLOW')
        expect(flaggedMeta.cascadeOnEnter).toBe(false)
        expect(flaggedMeta.compileEnforced).toBe(true)

        const deprecatedMeta = getStandingMetadata('DEPRECATED_ARCHIVED')
        expect(deprecatedMeta.badge).toBe('RED')
        expect(deprecatedMeta.cascadeOnEnter).toBe(true)
        expect(deprecatedMeta.compileEnforced).toBe(false)
    })

    it('validates type guard isEpistemologicalStanding', () => {
        expect(isEpistemologicalStanding('ACTIVE_ENDORSED')).toBe(true)
        expect(isEpistemologicalStanding('FLAGGED_FOR_REVIEW')).toBe(true)
        expect(isEpistemologicalStanding('DEPRECATED_ARCHIVED')).toBe(true)
        expect(isEpistemologicalStanding('UNKNOWN_STATE')).toBe(false)
        expect(isEpistemologicalStanding(null)).toBe(false)
    })

    it('rejects floating-point numbers in in_degree_count', () => {
        const floatInDegree = {
            ...validStandingRecord,
            in_degree_count: 12.5,
        }
        const result = CanonFactStandingSchema.safeParse(floatInDegree)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                '[FLOAT_PROHIBITED]',
            )
        }
    })

    it('rejects floating-point numbers in days_since_reconsideration', () => {
        const floatDays = {
            ...validStandingRecord,
            days_since_reconsideration: 1.2,
        }
        const result = CanonFactStandingSchema.safeParse(floatDays)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                '[FLOAT_PROHIBITED]',
            )
        }
    })

    it('rejects floating-point numbers in last_reviewed_epoch', () => {
        const floatEpoch = {
            ...validStandingRecord,
            last_reviewed_epoch: 100.75,
        }
        const result = CanonFactStandingSchema.safeParse(floatEpoch)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                '[FLOAT_PROHIBITED]',
            )
        }
    })

    it('rejects negative integer counts', () => {
        const negativeCount = {
            ...validStandingRecord,
            in_degree_count: -1,
        }
        const result = CanonFactStandingSchema.safeParse(negativeCount)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain('[OUT_OF_BOUNDS]')
        }
    })

    it('rejects malformed fact_id identifiers', () => {
        const badId = {
            ...validStandingRecord,
            fact_id: 'invalid_prefix_arm',
        }
        const result = CanonFactStandingSchema.safeParse(badId)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                '[STANDING_SCHEMA_BREACH]',
            )
        }
    })

    it('rejects undeclared properties in strict mode', () => {
        const rogueKeys = {
            ...validStandingRecord,
            unauthorized_mutation: true,
        }
        const result = CanonFactStandingSchema.safeParse(rogueKeys)
        expect(result.success).toBe(false)
    })
})
