import { describe, it, expect } from 'vitest'
import {
    calculateVocalDspProfile,
    assertIntegerMetric,
} from '../buz/vocalDsp.buzz'
import { configureVocalDsp } from '../buz/trauma.buzz'
import { TraumaModel } from '../trauma.model'

describe('37.trauma.unit - Vocal DSP Formant Modifier Schema Definition', () => {
    it('allocates neutral baseline parameters for uninjured actors', () => {
        const profile = calculateVocalDspProfile({
            entityId: 'char_bog',
            conditions: [],
        })

        expect(profile.pitchShiftCentitones).toBe(0)
        expect(profile.formantWarpingBps).toBe(10000)
        expect(profile.speedMultiplierBps).toBe(10000)
        expect(profile.breathinessPauseMultiplierBps).toBe(10000)
        expect(profile.vocalFryDensityBps).toBe(0)
        expect(profile.hasLaryngealTrauma).toBe(false)
        expect(profile.hasPulmonaryTrauma).toBe(false)
        expect(profile.bannedCadences).toEqual([])
    })

    it('maps crushed larynx to compressed formants, dropped pitch, vocal fry, and banned cadences', () => {
        const profile = calculateVocalDspProfile({
            entityId: 'char_bog',
            conditions: ['crushed_larynx'],
        })

        expect(profile.hasLaryngealTrauma).toBe(true)
        expect(profile.formantWarpingBps).toBe(7000) // 0.70x pharyngeal squeeze
        expect(profile.pitchShiftCentitones).toBe(-400) // -4.0 semitones
        expect(profile.vocalFryDensityBps).toBe(4500) // 45% glottal creak
        expect(profile.bannedCadences).toContain('RAPID_STACCATO')
        expect(profile.bannedCadences).toContain(
            'RISING_INFLECTION_INTERROGATIVE',
        )
        expect(profile.matchedAcousticConditions).toEqual(['crushed_larynx'])
    })

    it('maps pulmonary fibrosis to breath dilation, slowed tempo, and cadence bans', () => {
        const profile = calculateVocalDspProfile({
            entityId: 'char_oddwadd',
            conditions: ['pulmonary_fibrosis'],
        })

        expect(profile.hasPulmonaryTrauma).toBe(true)
        expect(profile.breathinessPauseMultiplierBps).toBe(22000) // 2.2x pause dilation
        expect(profile.speedMultiplierBps).toBe(8500) // 0.85x speed
        expect(profile.bannedCadences).toContain('RAPID_STACCATO')
        expect(profile.bannedCadences).toContain('UPBEAT_LILT')
    })

    it('enforces schema failure if laryngeal trauma is declared with uncompressed formants (> 9000 bps)', () => {
        expect(() =>
            calculateVocalDspProfile({
                entityId: 'char_invalid',
                conditions: ['crushed_larynx'],
                explicitFormantWarpingBps: 11000, // Invalid: must be <= 9000
            }),
        ).toThrowError('[VOCAL_DSP_SCHEMA_BREACH]')
    })

    it('throws an explicit error when non-integer basis points or centitones are provided', () => {
        expect(() =>
            assertIntegerMetric(-2.5, 'pitchShiftCentitones'),
        ).toThrowError('[FLOAT_PROHIBITED]')
        expect(() =>
            assertIntegerMetric(8600.5, 'formantWarpingBps'),
        ).toThrowError('[FLOAT_PROHIBITED]')
    })

    it('records vocal DSP profiles into TraumaModel via configureVocalDsp buzzer', () => {
        const model = new TraumaModel()
        let emittedProfile: any

        configureVocalDsp(
            model,
            {
                idx: 'test-configure-dsp',
                dat: {
                    entityId: 'char_wart',
                    conditions: ['crushed_larynx', 'pulmonary_fibrosis'],
                },
                slv: (res) => {
                    emittedProfile = res.trmBit.dat
                },
            },
            {} as any,
        )

        expect(emittedProfile).toBeDefined()
        expect(emittedProfile.hasLaryngealTrauma).toBe(true)
        expect(emittedProfile.hasPulmonaryTrauma).toBe(true)
        expect(emittedProfile.formantWarpingBps).toBe(7000)
        expect(emittedProfile.breathinessPauseMultiplierBps).toBe(22000)
        expect(model.vocalDspProfiles['char_wart']).toBeDefined()
        expect(model.vocalDspProfiles['char_wart'].bannedCadences).toContain(
            'RAPID_STACCATO',
        )
    })
})
