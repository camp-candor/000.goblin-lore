import { describe, it, expect } from 'vitest'
import {
    calculateCompoundTraumaLimbClamping,
    clampCompoundTrauma,
    assertIntegerBps,
} from '../buz/wound.buzz.js'
import { WoundModel } from '../wound.model.js'

describe('40.wound.unit - Compound Trauma Limb Clamper Calculation', () => {
    it('allocates 20,000 bps (2.0 arms) for uninjured bipedal characters', () => {
        const result = calculateCompoundTraumaLimbClamping({
            entityId: 'char_bog',
            locomotionBaseline: 'bipedal_standard',
            conditions: [],
        })

        expect(result.baseArmsBps).toBe(20000)
        expect(result.penaltiesAppliedCount).toBe(0)
        expect(result.availableArmsBps).toBe(20000)
        expect(result.armsAvailable).toBe(2)
        expect(result.isClampedAtZero).toBe(false)
    })

    it('drops to 0 bps immediately for sessile or slithering baselines', () => {
        const sessileResult = calculateCompoundTraumaLimbClamping({
            entityId: 'char_barnacle',
            locomotionBaseline: 'sessile',
            conditions: [],
        })
        expect(sessileResult.availableArmsBps).toBe(0)
        expect(sessileResult.armsAvailable).toBe(0)

        const slitheringResult = calculateCompoundTraumaLimbClamping({
            entityId: 'char_worm',
            locomotionBaseline: 'slithering',
            conditions: [],
        })
        expect(slitheringResult.availableArmsBps).toBe(0)
        expect(slitheringResult.armsAvailable).toBe(0)
    })

    it('correctly deduces 10,000 bps for a single severe condition (Wart)', () => {
        const result = calculateCompoundTraumaLimbClamping({
            entityId: 'char_wart',
            locomotionBaseline: 'bipedal_hunched',
            conditions: ['severed_left_arm'],
        })

        expect(result.baseArmsBps).toBe(20000)
        expect(result.penaltiesAppliedCount).toBe(1)
        expect(result.totalPenaltyBps).toBe(10000)
        expect(result.availableArmsBps).toBe(10000)
        expect(result.armsAvailable).toBe(1)
        expect(result.isClampedAtZero).toBe(false)
        expect(result.matchedSevereConditions).toEqual(['severed_left_arm'])
    })

    it('matches severe conditions case-insensitively and ignores non-severe conditions', () => {
        const result = calculateCompoundTraumaLimbClamping({
            entityId: 'char_pilot',
            locomotionBaseline: 'limping',
            conditions: [
                'BRAXIAL_PLEXUS_SEVERED', // Severe
                'stiff_left_knee', // Ignored
                'exhaustion_tier_1', // Ignored
            ],
        })

        expect(result.penaltiesAppliedCount).toBe(1)
        expect(result.availableArmsBps).toBe(10000)
        expect(result.armsAvailable).toBe(1)
        expect(result.matchedSevereConditions).toEqual([
            'braxial_plexus_severed',
        ])
    })

    it('clamps compound multiple severe traumas at 0 bps without negative underflow', () => {
        const compoundResult = calculateCompoundTraumaLimbClamping({
            entityId: 'char_mutilated_goblin',
            locomotionBaseline: 'bipedal_hunched',
            conditions: [
                'severed_left_arm',
                'paralyzed_arm',
                'amputated_limb', // 3 severe conditions = 30,000 bps penalty
            ],
        })

        expect(compoundResult.baseArmsBps).toBe(20000)
        expect(compoundResult.penaltiesAppliedCount).toBe(3)
        expect(compoundResult.totalPenaltyBps).toBe(30000)
        expect(compoundResult.rawCalculatedBps).toBe(-10000)
        expect(compoundResult.availableArmsBps).toBe(0) // Clamped!
        expect(compoundResult.armsAvailable).toBe(0)
        expect(compoundResult.isClampedAtZero).toBe(true)
    })

    it('throws an explicit error when float basis points are provided', () => {
        expect(() => assertIntegerBps(10000.5, 'testBasisPoints')).toThrowError(
            '[FLOAT_PROHIBITED]',
        )
    })

    it('mutates model state cleanly via clampCompoundTrauma reducer buzz routine', () => {
        const model = new WoundModel()
        let emittedReceipt: any

        clampCompoundTrauma(
            model,
            {
                idx: 'test-clamp',
                dat: {
                    entityId: 'char_wart',
                    locomotionBaseline: 'bipedal_hunched',
                    conditions: ['severed_left_arm', 'paralyzed_arm'],
                },
                slv: (res) => {
                    emittedReceipt = res.wndBit.dat
                },
            },
            {} as any,
        )

        expect(emittedReceipt).toBeDefined()
        expect(emittedReceipt.availableArmsBps).toBe(0)
        expect(emittedReceipt.armsAvailable).toBe(0)
        expect(model.clampedReceipts['char_wart']).toBeDefined()
        expect(model.clampedReceipts['char_wart'].isClampedAtZero).toBe(false) // raw was exactly 0
    })
})
