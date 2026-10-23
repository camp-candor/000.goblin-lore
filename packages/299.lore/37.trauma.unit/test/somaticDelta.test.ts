import { describe, it, expect } from 'vitest'
import {
    calculateSomaticDeltaResolution,
    createDefaultSomaticReceipt,
    deriveLocomotionTier,
    assertIntegerMetric,
} from '../buz/somaticDelta.buzz'
import { resolveSomaticDelta } from '../buz/trauma.buzz'
import { TraumaModel } from '../trauma.model'

describe('37.trauma.unit - Wound Unit Somatic Delta Resolution', () => {
    it('initializes clean baseline somatic receipt for uninjured character', () => {
        const defaultState = createDefaultSomaticReceipt('char_bog')
        expect(defaultState.armsAvailable).toBe(2)
        expect(defaultState.legsAvailable).toBe(2)
        expect(defaultState.locomotionTier).toBe('UNRESTRICTED')
        expect(defaultState.fatigueBps).toBe(0)
        expect(defaultState.painBps).toBe(0)
        expect(defaultState.isRefusalStrained).toBe(false)
    })

    it('applies trauma deltas and clamps basis points within [0, 10000]', () => {
        const current = createDefaultSomaticReceipt('char_wart')
        const result = calculateSomaticDeltaResolution(current, {
            entityId: 'char_wart',
            conditionsAdded: ['severed_left_arm'],
            deltaPainBps: 6000,
            deltaFatigueBps: 4500,
            deltaRefusalStrainBps: 8500,
            tick: 42,
        })

        expect(result.activeConditions).toEqual(['severed_left_arm'])
        expect(result.armsAvailable).toBe(1)
        expect(result.availableArmsBps).toBe(10000)
        expect(result.painBps).toBe(6000)
        expect(result.fatigueBps).toBe(4500)
        expect(result.refusalStrainBps).toBe(8500)
        expect(result.isRefusalStrained).toBe(true)
        expect(result.locomotionTier).toBe('LIMPING') // pain >= 5000 bps
        expect(result.updatedAtTick).toBe(42)
    })

    it('correctly shifts locomotion tier to IMMOBILIZED upon critical pain or leg loss', () => {
        expect(deriveLocomotionTier(2, 9500, [])).toBe('IMMOBILIZED')
        expect(deriveLocomotionTier(0, 1000, [])).toBe('IMMOBILIZED')
        expect(deriveLocomotionTier(1, 1000, [])).toBe('LIMPING')
        expect(deriveLocomotionTier(2, 1000, ['UNSTEADY_GAIT'])).toBe('LIMPING')
        expect(deriveLocomotionTier(2, 2000, [])).toBe('UNRESTRICTED')
    })

    it('removes conditions and heals strain meters cleanly', () => {
        const current = createDefaultSomaticReceipt('char_spleen')
        const injured = calculateSomaticDeltaResolution(current, {
            entityId: 'char_spleen',
            conditionsAdded: ['corneal_scarring', 'crushed_larynx'],
            deltaPainBps: 8000,
            tick: 10,
        })

        expect(injured.sensoryProfile.opticalState).toBe('MONOCULAR')
        expect(injured.vocalDspProfile.hasLaryngealTrauma).toBe(true)

        const healed = calculateSomaticDeltaResolution(injured, {
            entityId: 'char_spleen',
            conditionsRemoved: ['corneal_scarring'],
            deltaPainBps: -5000,
            tick: 20,
        })

        expect(healed.activeConditions).toEqual(['crushed_larynx'])
        expect(healed.painBps).toBe(3000)
        expect(healed.sensoryProfile.opticalState).toBe('NORMAL')
        expect(healed.vocalDspProfile.hasLaryngealTrauma).toBe(true)
    })

    it('throws an unhandled error when float basis points are passed to deltas', () => {
        expect(() => assertIntegerMetric(100.5, 'deltaPainBps')).toThrowError(
            '[FLOAT_PROHIBITED]',
        )
    })

    it('resolves somatic deltas through TraumaModel reducer buzzing', () => {
        const model = new TraumaModel()
        let emittedReceipt: any

        resolveSomaticDelta(
            model,
            {
                idx: 'resolve-wart',
                dat: {
                    entityId: 'char_wart',
                    conditionsAdded: ['severed_left_arm', 'tinnitus_severe'],
                    deltaPainBps: 5500,
                    deltaLegs: -1,
                },
                slv: (res) => {
                    emittedReceipt = res.trmBit.dat
                },
            },
            {} as any,
        )

        expect(emittedReceipt).toBeDefined()
        expect(emittedReceipt.armsAvailable).toBe(1)
        expect(emittedReceipt.legsAvailable).toBe(1)
        expect(emittedReceipt.locomotionTier).toBe('LIMPING')
        expect(model.somaticStates['char_wart']).toBeDefined()
        expect(model.sensoryProfiles['char_wart']).toBeDefined()
        expect(model.vocalDspProfiles['char_wart']).toBeDefined()
    })
})
