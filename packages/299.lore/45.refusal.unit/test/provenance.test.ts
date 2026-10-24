import { describe, it, expect } from 'vitest'
import {
    computeExcerptSha256,
    verifyExcerptParity,
    bindDiscoveryProvenance,
} from '../buz/provenance.buzz'
import { RefusalModel } from '../refusal.model'

describe('45.refusal.unit: Discovery Excerpt Provenance Hash Binder', () => {
    const sampleExcerpt =
        'Wart refused to count the tallow candles while Mum Grissel watched from the ladder.'
    const expectedHash = computeExcerptSha256(sampleExcerpt)

    it('computes a consistent 64-character lowercase hex SHA-256 hash', () => {
        expect(expectedHash).toMatch(/^[0-9a-f]{64}$/)
        expect(verifyExcerptParity(sampleExcerpt, expectedHash)).toBe(true)
        expect(
            verifyExcerptParity(sampleExcerpt + ' extra text', expectedHash),
        ).toBe(false)
    })

    it('binds winning discovery excerpt and returns valid provenance receipt at T0 ($0.00)', () => {
        let result: any = null
        const model = new RefusalModel()

        bindDiscoveryProvenance(
            model,
            {
                idx: 'char_wart',
                dat: {
                    character_id: 'char_wart',
                    refusal_id: 'ref_no_candle_tally',
                    take_id: 'TAKE_B',
                    excerpt_text_ascii: sampleExcerpt,
                    source_note_id: 'ingest_20261019_003',
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(1)
        expect(result.rflBit.dat.isValid).toBe(true)
        expect(result.rflBit.dat.take_id).toBe('TAKE_B')
        expect(result.rflBit.dat.discovery_provenance_sha256).toBe(expectedHash)
        expect(result.rflBit.dat.source_note_id).toBe('ingest_20261019_003')
    })

    it('verifies expected hash parity matching when bal.src is provided', () => {
        let result: any = null
        const model = new RefusalModel()

        bindDiscoveryProvenance(
            model,
            {
                idx: 'char_wart',
                src: expectedHash,
                dat: {
                    character_id: 'char_wart',
                    refusal_id: 'ref_no_candle_tally',
                    take_id: 'TAKE_B',
                    excerpt_text_ascii: sampleExcerpt,
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(1)
        expect(result.rflBit.dat.isValid).toBe(true)
    })

    it('fails closed when expected hash diverges from computed excerpt hash', () => {
        let result: any = null
        const model = new RefusalModel()
        const wrongHash =
            'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'

        bindDiscoveryProvenance(
            model,
            {
                idx: 'char_wart',
                src: wrongHash,
                dat: {
                    character_id: 'char_wart',
                    refusal_id: 'ref_no_candle_tally',
                    take_id: 'TAKE_B',
                    excerpt_text_ascii: sampleExcerpt,
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(0)
        expect(result.rflBit.dat.isValid).toBe(false)
        expect(result.rflBit.dat.errorCode).toBe(
            'PROVENANCE_HASH_PARITY_BREACH',
        )
    })

    it('fails closed when non-ASCII characters are present in excerpt text', () => {
        let result: any = null
        const model = new RefusalModel()
        const unicodeExcerpt = 'Wart looked at the candle\u2026 and refused.' // Ellipsis is non-ASCII!

        bindDiscoveryProvenance(
            model,
            {
                idx: 'char_wart',
                dat: {
                    character_id: 'char_wart',
                    refusal_id: 'ref_no_candle_tally',
                    take_id: 'TAKE_C',
                    excerpt_text_ascii: unicodeExcerpt,
                },
                slv: (res: any) => {
                    result = res
                },
            },
            {} as any,
        )

        expect(result).not.toBeNull()
        expect(result.rflBit.val).toBe(0)
        expect(result.rflBit.dat.isValid).toBe(false)
        expect(result.rflBit.dat.errorCode).toBe(
            'INVALID_PROVENANCE_PAYLOAD_BREACH',
        )
    })
})
