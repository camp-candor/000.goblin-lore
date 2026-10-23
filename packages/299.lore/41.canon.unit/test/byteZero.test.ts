import { describe, it, expect } from 'vitest'
import { DossierExtractionFailureBit } from '../fce/byteZero.bit.js'
import {
    verifyByteZeroIntegrity,
    extractRawFrontmatterAndBody,
    extractByteZeroFactDossier,
    assertByteZeroFactDossier,
} from '../buz/byteZero.buzz.js'

describe('41.canon.unit: Byte-Zero Frontmatter Fact Extractor', () => {
    const validDossier = [
        '---',
        'id: fact_culvert_valve',
        'claim_text: Pressure valve is sealed.',
        'scope: LOCATION',
        'authority_level: CANON',
        'standing: ACTIVE_ENDORSED',
        'version: 1',
        '---',
        '',
        '## Human Voice Rail',
        'The valve handle was cold to the touch.',
    ].join('\n')

    it('POSITIVE: Validates pristine Byte-0 frontmatter buffer', () => {
        const check = verifyByteZeroIntegrity(Buffer.from(validDossier, 'utf8'))
        expect(check.valid).toBe(true)
        expect(check.byteOffset).toBe(0)
        expect(check.hasBom).toBe(false)
        expect(check.hasCarriageReturns).toBe(false)

        const extracted = extractRawFrontmatterAndBody(validDossier)
        expect(extracted.rawYaml).toContain('id: fact_culvert_valve')
        expect(extracted.proseBody).toContain(
            'The valve handle was cold to the touch.',
        )

        const result = extractByteZeroFactDossier('test.md', validDossier)
        expect(result.valid).toBe(true)
        if (result.valid) {
            expect((result.frontmatter as Record<string, unknown>).id).toBe(
                'fact_culvert_valve',
            )
            expect(result.proseBody).toContain(
                'The valve handle was cold to the touch.',
            )
            expect(Object.isFrozen(result.frontmatter)).toBe(true)
        }
    })

    it('POSITIVE: assertByteZeroFactDossier succeeds on valid file', () => {
        expect(() =>
            assertByteZeroFactDossier('test.md', validDossier),
        ).not.toThrow()
    })

    it('POSITIVE: Preserves Body-is-King prose even with non-POSIX CRLF newlines outside header', () => {
        const rawProse =
            '\n## Wants (surface)\r\nUnescaped *quotes* and raw notes:[cite: 42]\n'
        const rawPayload = '---\nid: fact_prose_test\n---\n' + rawProse
        const result = extractByteZeroFactDossier(
            'test_prose.md',
            Buffer.from(rawPayload, 'utf8'),
        )
        expect(result.valid).toBe(true)
        if (result.valid) {
            expect(result.proseBody).toBe(rawProse)
        }
    })

    it('NEGATIVE CONTROL: Traps UTF-8 BOM at byte 0 at T_0 ($0.00)', () => {
        const bomBuffer = Buffer.concat([
            Buffer.from([0xef, 0xbb, 0xbf]),
            Buffer.from(validDossier, 'utf8'),
        ])

        const check = verifyByteZeroIntegrity(bomBuffer)
        expect(check.valid).toBe(false)
        expect(check.hasBom).toBe(true)
        expect(check.errorCode).toBe('UTF8_BOM_DETECTED')

        const result = extractByteZeroFactDossier('bom.md', bomBuffer)
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect((result as DossierExtractionFailureBit).errorCode).toBe(
                'UTF8_BOM_DETECTED',
            )
        }

        expect(() => assertByteZeroFactDossier('bom.md', bomBuffer)).toThrow(
            /UTF8_BOM_DETECTED/,
        )
    })

    it('NEGATIVE CONTROL: Traps leading whitespace or newlines at byte 0 at T_0 ($0.00)', () => {
        const leadingSpace = ' ' + validDossier
        const leadingNewline = '\n' + validDossier
        const leadingTab = '\t' + validDossier

        for (const bad of [leadingSpace, leadingNewline, leadingTab]) {
            const check = verifyByteZeroIntegrity(bad)
            expect(check.valid).toBe(false)
            expect(check.errorCode).toBe('LEADING_WHITESPACE_DETECTED')
            expect(() => assertByteZeroFactDossier('space.md', bad)).toThrow(
                /LEADING_WHITESPACE_DETECTED/,
            )
        }
    })

    it('NEGATIVE CONTROL: Traps non-POSIX CRLF carriage returns at T_0 ($0.00)', () => {
        const crlfDossier = validDossier.replace(/\n/g, '\r\n')
        const check = verifyByteZeroIntegrity(Buffer.from(crlfDossier, 'utf8'))
        expect(check.valid).toBe(false)
        expect(check.hasCarriageReturns).toBe(true)
        expect(check.errorCode).toBe('CARRIAGE_RETURN_NON_POSIX')

        expect(() => assertByteZeroFactDossier('crlf.md', crlfDossier)).toThrow(
            /CARRIAGE_RETURN_NON_POSIX/,
        )
    })

    it('NEGATIVE CONTROL: Traps missing opening delimiter at byte 0', () => {
        const noHeader = '# Title\n' + validDossier
        const check = verifyByteZeroIntegrity(noHeader)
        expect(check.valid).toBe(false)
        expect(check.errorCode).toBe('MISSING_BYTE_ZERO_DELIMITER')
    })

    it('NEGATIVE CONTROL: Traps payload under 4 bytes', () => {
        const check = verifyByteZeroIntegrity('---')
        expect(check.valid).toBe(false)
        expect(check.errorCode).toBe('PAYLOAD_TOO_SHORT')
    })

    it('NEGATIVE CONTROL: Traps missing closing delimiter', () => {
        const unclosed = '---\nid: fact_broken\nclaim_text: No end'
        const result = extractByteZeroFactDossier('unclosed.md', unclosed)
        expect(result.valid).toBe(false)
        if (!result.valid) {
            expect((result as DossierExtractionFailureBit).errorCode).toBe(
                'MISSING_CLOSING_DELIMITER',
            )
        }
    })
})
