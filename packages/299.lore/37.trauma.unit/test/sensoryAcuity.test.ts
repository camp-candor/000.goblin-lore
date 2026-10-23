import { describe, it, expect } from 'vitest'
import {
    calculateSensoryAcuityProfile,
    assertIntegerMetric,
} from '../buz/sensory.buzz'
import { configureSensoryAcuity } from '../buz/trauma.buzz'
import { TraumaModel } from '../trauma.model'

describe('37.trauma.unit - Sensory Acuity Debuff Basis-Point Configuration', () => {
    it('allocates normal acuity and zero blind cone for uninjured actors', () => {
        const profile = calculateSensoryAcuityProfile({
            entityId: 'char_bog',
            conditions: [],
        })

        expect(profile.opticalState).toBe('NORMAL')
        expect(profile.blindConeDegrees).toBe(0)
        expect(profile.visualAcuityBps).toBe(10000)
        expect(profile.auditoryFloorDebuffCdB).toBe(0)
        expect(profile.hasAcousticTrauma).toBe(false)
    })

    it('maps corneal scarring to monocular vision with a 60-degree blind cone and 5,000 bps acuity', () => {
        const profile = calculateSensoryAcuityProfile({
            entityId: 'char_spleen',
            conditions: ['corneal_scarring'],
        })

        expect(profile.opticalState).toBe('MONOCULAR')
        expect(profile.blindConeDegrees).toBe(60)
        expect(profile.visualAcuityBps).toBe(5000)
        expect(profile.matchedOcularConditions).toEqual(['corneal_scarring'])
    })

    it('maps bilateral blindness to blind state with 360-degree blind cone and 0 bps acuity', () => {
        const profile = calculateSensoryAcuityProfile({
            entityId: 'char_blind_goblin',
            conditions: ['blind_both_eyes'],
        })

        expect(profile.opticalState).toBe('BLIND')
        expect(profile.blindConeDegrees).toBe(360)
        expect(profile.visualAcuityBps).toBe(0)
        expect(profile.matchedOcularConditions).toEqual(['blind_both_eyes'])
    })

    it('adds +1,500 cdB auditory debuff per concussive condition', () => {
        const profile = calculateSensoryAcuityProfile({
            entityId: 'char_wart',
            conditions: ['concussive_hearing_loss', 'tinnitus_severe'],
        })

        expect(profile.auditoryFloorDebuffCdB).toBe(3000) // 2 * 1500 cdB = 3000 cdB (30 dB)
        expect(profile.hasAcousticTrauma).toBe(true)
        expect(profile.matchedAcousticConditions).toEqual([
            'concussive_hearing_loss',
            'tinnitus_severe',
        ])
    })

    it('enforces schema failure if MONOCULAR is configured with a blind cone under 60 degrees', () => {
        expect(() =>
            calculateSensoryAcuityProfile({
                entityId: 'char_invalid',
                conditions: [],
                explicitOpticalState: 'MONOCULAR',
                explicitBlindConeDegrees: 45, // Invalid: must be >= 60
            }),
        ).toThrowError('[SENSORY_SCHEMA_BREACH]')
    })

    it('throws an explicit error when non-integer basis points or centibels are provided', () => {
        expect(() =>
            assertIntegerMetric(5000.5, 'visualAcuityBps'),
        ).toThrowError('[FLOAT_PROHIBITED]')
        expect(() =>
            assertIntegerMetric(1500.25, 'auditoryFloorDebuffCdB'),
        ).toThrowError('[FLOAT_PROHIBITED]')
    })

    it('records sensory profiles into TraumaModel via configureSensoryAcuity buzzer', () => {
        const model = new TraumaModel()
        let emittedProfile: any

        configureSensoryAcuity(
            model,
            {
                idx: 'test-configure',
                dat: {
                    entityId: 'char_wart',
                    conditions: ['corneal_scarring', 'concussive_hearing_loss'],
                },
                slv: (res) => {
                    emittedProfile = res.trmBit.dat
                },
            },
            {} as any,
        )

        expect(emittedProfile).toBeDefined()
        expect(emittedProfile.opticalState).toBe('MONOCULAR')
        expect(emittedProfile.auditoryFloorDebuffCdB).toBe(1500)
        expect(model.sensoryProfiles['char_wart']).toBeDefined()
        expect(model.sensoryProfiles['char_wart'].hasAcousticTrauma).toBe(true)
    })
})
