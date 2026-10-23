import { describe, it, expect } from 'vitest'
import {
    interceptPreWriteFact,
    assertPreWriteFact,
} from '../buz/interceptor.buzz.js'
import { computeFactContentHash } from '../../41.canon.unit/buz/canonHash.buzz.js'

describe('07.database.unit: Pre-Write Local SQLite Schema Interceptor', () => {
    const sampleClaim = 'Culvert pressure valve is sealed.'
    const sampleHash = computeFactContentHash('LOCATION', sampleClaim)

    const validInsertCandidate = {
        id: 'loc_culvert_valve',
        claim_text: sampleClaim,
        scope: 'LOCATION',
        authority_level: 'CANON',
        standing: 'ACTIVE_ENDORSED',
        version: 1,
        content_hash: sampleHash,
        author: 'Elena',
        created_at_ms: 1700000000000,
        last_edited_at_ms: 1700000000000,
    }

    it('POSITIVE: Certifies valid INSERT candidate', () => {
        const result = interceptPreWriteFact(validInsertCandidate)
        expect(result.valid).toBe(true)
        if (result.valid) {
            expect(result.operationType).toBe('INSERT')
            expect(result.sanitizedCandidate.id).toBe('loc_culvert_valve')
        }
        expect(() => assertPreWriteFact(validInsertCandidate)).not.toThrow()
    })

    it('POSITIVE: Certifies valid UPDATE candidate with contiguous increment', () => {
        const existing = {
            id: 'loc_culvert_valve',
            claim_text: sampleClaim,
            scope: 'LOCATION',
            authority_level: 'CANON',
            standing: 'ACTIVE_ENDORSED',
            version: 1,
            content_hash: sampleHash,
        }

        const updatedClaim = 'Culvert pressure valve is pried open.'
        const updatedHash = computeFactContentHash('LOCATION', updatedClaim)

        const validUpdateCandidate = {
            ...validInsertCandidate,
            claim_text: updatedClaim,
            version: 2,
            content_hash: updatedHash,
            last_edited_at_ms: 1700000010000,
        }

        const result = interceptPreWriteFact(validUpdateCandidate, existing)
        expect(result.valid).toBe(true)
        if (result.valid) {
            expect(result.operationType).toBe('UPDATE')
            expect(result.sanitizedCandidate.version).toBe(2)
        }
    })

    it('NEGATIVE CONTROL: Traps prefix-scope mismatch at T_0 ($0.00)', () => {
        const badPrefix = {
            ...validInsertCandidate,
            id: 'char_culvert_valve', // Wrong prefix for LOCATION
        }

        const result = interceptPreWriteFact(badPrefix)
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.errorCode).toBe('PRE_WRITE_PREFIX_MISMATCH')
        }
    })

    it('NEGATIVE CONTROL: Traps hash mismatch at T_0 ($0.00)', () => {
        const badHash = {
            ...validInsertCandidate,
            content_hash:
                '0000000000000000000000000000000000000000000000000000000000000000',
        }

        const result = interceptPreWriteFact(badHash)
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.errorCode).toBe('PRE_WRITE_HASH_MISMATCH')
        }
        expect(() => assertPreWriteFact(badHash)).toThrow(
            /PRE_WRITE_HASH_MISMATCH/,
        )
    })

    it('NEGATIVE CONTROL: Traps authority demotion attempt on UPDATE', () => {
        const existing = {
            id: 'loc_culvert_valve',
            claim_text: sampleClaim,
            scope: 'LOCATION',
            authority_level: 'AXIOM', // Higher rank (600)
            standing: 'ACTIVE_ENDORSED',
            version: 1,
            content_hash: sampleHash,
        }

        const demotingCandidate = {
            ...validInsertCandidate,
            authority_level: 'SPECULATION', // Lower rank (100)
            version: 2,
        }

        const result = interceptPreWriteFact(demotingCandidate, existing)
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.errorCode).toBe('PRE_WRITE_AUTHORITY_DEMOTION')
        }
    })

    it('NEGATIVE CONTROL: Traps unversioned silent mutation on UPDATE', () => {
        const existing = {
            id: 'loc_culvert_valve',
            claim_text: sampleClaim,
            scope: 'LOCATION',
            authority_level: 'CANON',
            standing: 'ACTIVE_ENDORSED',
            version: 1,
            content_hash: sampleHash,
        }

        const mutatedClaim = 'Culvert pressure valve is pried open.'
        const mutatedHash = computeFactContentHash('LOCATION', mutatedClaim)

        const silentMutationCandidate = {
            ...validInsertCandidate,
            claim_text: mutatedClaim,
            version: 1, // Mutated claim without bumping version
            content_hash: mutatedHash,
        }

        const result = interceptPreWriteFact(silentMutationCandidate, existing)
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.errorCode).toBe('PRE_WRITE_SILENT_MUTATION')
        }
    })

    it('NEGATIVE CONTROL: Traps sequence gap on UPDATE', () => {
        const existing = {
            id: 'loc_culvert_valve',
            claim_text: sampleClaim,
            scope: 'LOCATION',
            authority_level: 'CANON',
            standing: 'ACTIVE_ENDORSED',
            version: 1,
            content_hash: sampleHash,
        }

        const mutatedClaim = 'Culvert pressure valve is pried open.'
        const mutatedHash = computeFactContentHash('LOCATION', mutatedClaim)

        const gapCandidate = {
            ...validInsertCandidate,
            claim_text: mutatedClaim,
            version: 5, // Jumped from 1 to 5
            content_hash: mutatedHash,
        }

        const result = interceptPreWriteFact(gapCandidate, existing)
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.errorCode).toBe('PRE_WRITE_SEQUENCE_GAP')
        }
    })

    it('NEGATIVE CONTROL: Traps malformed payload at T_0 ($0.00)', () => {
        const malformed = {
            id: 'loc_culvert_valve',
            scope: 'INVALID_SCOPE',
        }

        const result = interceptPreWriteFact(malformed)
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect(result.errorCode).toBe('PRE_WRITE_MALFORMED_PAYLOAD')
        }
    })
})
