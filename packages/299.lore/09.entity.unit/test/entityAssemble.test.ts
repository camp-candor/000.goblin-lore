import { describe, it, expect } from 'vitest'
import {
    sanitizeProseStub,
    verifyByteZeroBuffer,
    assembleDualRailDossier,
} from '../buz/entityAssemble.buzz.js'

describe('09.entity.unit :: Dual-Rail Byte-Zero Dossier Assembler', () => {
    it('assembles a character dossier starting strictly at physical byte 0 with ---\\n', () => {
        const { dossierText, receipt } = assembleDualRailDossier(
            'character',
            {
                id: 'char_wart',
                name: 'Wart',
                created_at_epoch: 0,
                somatic: { available_arms_bps: 10000 },
            },
            {
                wantsSurface: 'Keep the boiler pressure steady.',
                wantsActual: 'Conceal the ledger.',
                blindSpot: 'Overlooks soot tracks.',
                voiceNotes: 'Terse and direct.',
                fewShotLines: ['Pipe is cracked.'],
                refusalVectors: [
                    {
                        trigger_condition: 'Ordered to lift two-handed valve',
                        mandatory_refusal: 'Refuses bimanual grip',
                        unavoidable_cost: 'Drops valve wheel',
                    },
                ],
            },
        )

        expect(receipt.valid).toBe(true)
        expect(receipt.firstFourBytesHex).toBe('2d2d2d0a')

        const buf = Buffer.from(dossierText, 'utf8')
        expect(buf[0]).toBe(0x2d)
        expect(buf[1]).toBe(0x2d)
        expect(buf[2]).toBe(0x2d)
        expect(buf[3]).toBe(0x0a)
        expect(dossierText).toContain('## Wants (surface)')
        expect(dossierText).toContain('## Refusal Vectors')
    })

    it('assembles location and possession dossiers with domain-specific voice sections', () => {
        const loc = assembleDualRailDossier(
            'location',
            { id: 'loc_culvert_siphon', created_at_epoch: 0 },
            {
                tacticalGeometry: 'Eight-inch iron pipe.',
                sensoryAtmosphere: 'Cold water drip.',
                structuralHazards: 'Slippery moss.',
            },
        )
        expect(loc.receipt.valid).toBe(true)
        expect(loc.dossierText).toContain('## Tactical Geometry')
        expect(loc.dossierText).toContain('## Sensory Atmosphere')

        const item = assembleDualRailDossier(
            'possession',
            { id: 'item_tallow_tin', created_at_epoch: 0 },
            {
                provenanceNotes: 'Stamped with foundry mark.',
                dramaticFunction: 'Provides emergency lamp fuel.',
            },
        )
        expect(item.receipt.valid).toBe(true)
        expect(item.dossierText).toContain('## Provenance Notes')
        expect(item.dossierText).toContain('## Dramatic Function')
    })

    it('rejects UTF-8 BOM, leading whitespace, and CRLF line endings in verifyByteZeroBuffer', () => {
        const bomBuffer = Buffer.concat([
            Buffer.from([0xef, 0xbb, 0xbf]),
            Buffer.from('---\nid: test\n---\n', 'utf8'),
        ])
        const bomAudit = verifyByteZeroBuffer(bomBuffer)
        expect(bomAudit.valid).toBe(false)
        expect(bomAudit.error).toContain('UTF-8 BOM')

        const leadingNewlineAudit = verifyByteZeroBuffer(
            '\n---\nid: test\n---\n',
        )
        expect(leadingNewlineAudit.valid).toBe(false)
        expect(leadingNewlineAudit.error).toContain('[BYTE_0_VIOLATION]')

        const crlfAudit = verifyByteZeroBuffer('---\r\nid: test\r\n---\r\n')
        expect(crlfAudit.valid).toBe(false)
        expect(crlfAudit.error).toContain('carriage return')
    })

    it('scrubs citation tags and HTML comment placeholders cleanly', () => {
        const dirty =
            'Siphon measures eight inches[cite: 1, 4] <!-- TODO: verify --> across.'
        const clean = sanitizeProseStub(dirty, 'fallback')
        expect(clean).toBe('Siphon measures eight inches  across.')
    })
})
