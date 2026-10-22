import { describe, it, expect } from 'vitest'
import {
    FactIdSchema,
    AuthorHandleSchema,
    Sha256HashSchema,
    FACT_ID_REGEX,
    AUTHOR_HANDLE_REGEX,
    SHA256_HEX_REGEX,
} from '../val/identifier.val.js'
import { IdentifierGateBuzz } from '../buz/identifier.buzz.js'

describe('06.facts.unit :: Snake-Case Identifier Regex Gate', () => {
    describe('Fact ID Positive Controls', () => {
        const validFactIds = [
            'fact_bog_shoulder',
            'fact_episode_09_intro',
            'fact_room_culvert_04',
            'fact_item_wrench_m8',
            'fact_axiom_thermodynamics',
            'fact_123_456',
        ]

        it.each(validFactIds)('accepts canonical fact ID: %s', (id) => {
            expect(() => FactIdSchema.parse(id)).not.toThrow()
            const result = IdentifierGateBuzz.validateFactId(id)
            expect(result.isValid).toBe(true)
            if (result.isValid) {
                expect(result.raw).toBe(id)
                expect(result.slug).toBe(id.slice(5))
                expect(result.length).toBe(id.length)
            }
            expect(() => IdentifierGateBuzz.assertFactId(id)).not.toThrow()
            expect(IdentifierGateBuzz.isFactIdFast(id)).toBe(true)
        })
    })

    describe('Fact ID Negative Controls (Fail-Closed Traps)', () => {
        const missingPrefix = [
            'bog_shoulder',
            'episode_09',
            'culvert_04',
            'item_wrench',
        ]

        it.each(missingPrefix)(
            'rejects fact ID missing required "fact_" prefix: %s',
            (id) => {
                expect(() => FactIdSchema.parse(id)).toThrow()
                const result = IdentifierGateBuzz.validateFactId(id)
                expect(result.isValid).toBe(false)
                if (!result.isValid) {
                    expect(result.errorCode).toBe('INVALID_PATTERN')
                }
                expect(() => IdentifierGateBuzz.assertFactId(id)).toThrow(
                    /SCHEMA_GATE_FAIL/,
                )
                expect(IdentifierGateBuzz.isFactIdFast(id)).toBe(false)
            },
        )

        const casingViolations = [
            'fact_BogShoulder',
            'Fact_bog_shoulder',
            'FACT_BOG_SHOULDER',
            'fact_bogShoulderDislocated',
            'fact_Culvert-04',
        ]

        it.each(casingViolations)(
            'rejects camelCase, PascalCase, or uppercase characters: %s',
            (id) => {
                expect(() => FactIdSchema.parse(id)).toThrow()
                const result = IdentifierGateBuzz.validateFactId(id)
                expect(result.isValid).toBe(false)
                expect(IdentifierGateBuzz.isFactIdFast(id)).toBe(false)
            },
        )

        const symbolAndSpacingViolations = [
            'fact_bog shoulder',
            'fact_bog-shoulder',
            'fact_bog.shoulder',
            'fact_bog@shoulder',
            'fact_bog$shoulder',
            'fact_bog/shoulder',
        ]

        it.each(symbolAndSpacingViolations)(
            'rejects spaces, dashes, dots, and illegal punctuation: %s',
            (id) => {
                expect(() => FactIdSchema.parse(id)).toThrow()
                const result = IdentifierGateBuzz.validateFactId(id)
                expect(result.isValid).toBe(false)
                expect(IdentifierGateBuzz.isFactIdFast(id)).toBe(false)
            },
        )

        it('rejects underflow strings shorter than 6 characters', () => {
            const underflow = 'fact_'
            expect(() => FactIdSchema.parse(underflow)).toThrow()
            const result = IdentifierGateBuzz.validateFactId(underflow)
            expect(result.isValid).toBe(false)
            if (!result.isValid) {
                expect(result.errorCode).toBe('LENGTH_VIOLATION')
            }
        })

        it('rejects overflow strings exceeding 128 characters', () => {
            const overflow = 'fact_' + 'a'.repeat(124) // 129 chars total
            expect(() => FactIdSchema.parse(overflow)).toThrow()
            const result = IdentifierGateBuzz.validateFactId(overflow)
            expect(result.isValid).toBe(false)
            if (!result.isValid) {
                expect(result.errorCode).toBe('LENGTH_VIOLATION')
            }
        })

        it('rejects non-string primitive types fail-closed', () => {
            const nonStrings = [null, undefined, 12345, true, {}, []]
            for (const item of nonStrings) {
                expect(() => FactIdSchema.parse(item)).toThrow()
                const result = IdentifierGateBuzz.validateFactId(item)
                expect(result.isValid).toBe(false)
                if (!result.isValid) {
                    expect(result.errorCode).toBe('INVALID_TYPE')
                }
            }
        })
    })

    describe('Author Handle & SHA-256 Digest Validation', () => {
        it('validates canonical author handles', () => {
            const validAuthors = ['lead_writer', 'director_01', 'agent_alpha']
            for (const author of validAuthors) {
                expect(() => AuthorHandleSchema.parse(author)).not.toThrow()
                expect(IdentifierGateBuzz.validateAuthor(author)).toBe(true)
            }
        })

        it('rejects invalid author handles', () => {
            const invalidAuthors = [
                'LeadWriter',
                'lead-writer',
                'writer@studio',
                '',
            ]
            for (const author of invalidAuthors) {
                expect(() => AuthorHandleSchema.parse(author)).toThrow()
                expect(IdentifierGateBuzz.validateAuthor(author)).toBe(false)
            }
        })

        it('validates 64-character lowercase hexadecimal SHA-256 digests', () => {
            const validHash =
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
            expect(() => Sha256HashSchema.parse(validHash)).not.toThrow()
            expect(IdentifierGateBuzz.validateHash(validHash)).toBe(true)
        })

        it('rejects invalid SHA-256 hashes (length mismatch, uppercase, or invalid characters)', () => {
            const invalidHashes = [
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b85', // 63 chars
                'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855', // uppercase
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b8zz', // invalid hex 'zz'
            ]
            for (const hash of invalidHashes) {
                expect(() => Sha256HashSchema.parse(hash)).toThrow()
                expect(IdentifierGateBuzz.validateHash(hash)).toBe(false)
            }
        })
    })
})
