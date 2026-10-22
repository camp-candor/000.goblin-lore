import { describe, it, expect } from 'vitest'
import {
    FactIdSchema,
    AuthorHandleSchema,
    Sha256HashSchema,
} from '../val/identifier.val.js'
import { IdentifierGateBuzz } from '../buz/schema.buzz.js'

describe('26.schema.unit :: Snake-Case Identifier Regex Gate', () => {
    describe('Positive Controls (Valid Identifiers)', () => {
        it('accepts valid snake_case fact identifiers prefixed with fact_', () => {
            const validCases = [
                'fact_bog_shoulder',
                'fact_valve_04_sealed',
                'fact_iron_knife_mass_120g',
                'fact_culvert_siphon_intact',
                'fact_character_001_limp',
            ]

            for (const id of validCases) {
                expect(FactIdSchema.parse(id)).toBe(id)
                const result = IdentifierGateBuzz.validateFactId(id)
                expect(result.isValid).toBe(true)
                if (result.isValid) {
                    expect(result.prefix).toBe('fact_')
                    expect(result.raw).toBe(id)
                }
                expect(IdentifierGateBuzz.isFactIdFast(id)).toBe(true)
            }
        })

        it('accepts valid author handles', () => {
            const validAuthors = [
                'lead_writer',
                'showrunner',
                'jules_01',
                'editor',
            ]
            for (const author of validAuthors) {
                expect(AuthorHandleSchema.parse(author)).toBe(author)
                expect(IdentifierGateBuzz.validateAuthor(author)).toBe(true)
            }
        })

        it('accepts valid 64-character lowercase SHA-256 digests', () => {
            const validHash =
                'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
            expect(Sha256HashSchema.parse(validHash)).toBe(validHash)
            expect(IdentifierGateBuzz.validateHash(validHash)).toBe(true)
        })
    })

    describe('Negative Controls (Malformed Identifiers Fail Closed)', () => {
        it('rejects identifiers missing the fact_ prefix', () => {
            const invalid = 'bog_shoulder_broken'
            expect(() => FactIdSchema.parse(invalid)).toThrow(/pattern \^fact_/)
            const res = IdentifierGateBuzz.validateFactId(invalid)
            expect(res.isValid).toBe(false)
            expect(() => IdentifierGateBuzz.assertFactId(invalid)).toThrow(
                /SCHEMA_GATE_FAIL/,
            )
        })

        it('rejects camelCase and PascalCase identifiers', () => {
            const cases = [
                'fact_bogShoulder',
                'fact_BogShoulder',
                'Fact_bog_shoulder',
            ]
            for (const c of cases) {
                expect(() => FactIdSchema.parse(c)).toThrow()
                expect(IdentifierGateBuzz.isFactIdFast(c)).toBe(false)
            }
        })

        it('rejects kebab-case and spaced identifiers', () => {
            const cases = [
                'fact-bog-shoulder',
                'fact bog shoulder',
                'fact_bog-shoulder',
            ]
            for (const c of cases) {
                expect(() => FactIdSchema.parse(c)).toThrow()
                expect(IdentifierGateBuzz.validateFactId(c).isValid).toBe(false)
            }
        })

        it('rejects identifiers with illegal punctuation or non-ASCII characters', () => {
            const cases = [
                'fact_bog$shoulder',
                'fact_bog.shoulder',
                'fact_bog_shoulder!',
            ]
            for (const c of cases) {
                expect(() => FactIdSchema.parse(c)).toThrow()
            }
        })

        it('rejects identifiers violating boundary length constraints', () => {
            const tooShort = 'fact_' // length 5 (min 6 required)
            const tooLong = 'fact_' + 'a'.repeat(125) // length 130 (max 128)

            expect(() => FactIdSchema.parse(tooShort)).toThrow()
            expect(() => FactIdSchema.parse(tooLong)).toThrow()
            expect(IdentifierGateBuzz.validateFactId(tooShort).isValid).toBe(
                false,
            )
            expect(IdentifierGateBuzz.validateFactId(tooLong).isValid).toBe(
                false,
            )
        })

        it('rejects non-string primitives', () => {
            const cases = [12345, null, undefined, {}, true]
            for (const c of cases) {
                const res = IdentifierGateBuzz.validateFactId(c)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('INVALID_TYPE')
                }
            }
        })

        it('rejects uppercase and truncated hashes', () => {
            const uppercaseHash =
                'E3B0C44298FC1C149AFBF4C8996FB92427AE41E4649B934CA495991B7852B855'
            const truncatedHash = 'e3b0c44298fc1c14'

            expect(() => Sha256HashSchema.parse(uppercaseHash)).toThrow()
            expect(() => Sha256HashSchema.parse(truncatedHash)).toThrow()
            expect(IdentifierGateBuzz.validateHash(uppercaseHash)).toBe(false)
            expect(IdentifierGateBuzz.validateHash(truncatedHash)).toBe(false)
        })
    })
})
