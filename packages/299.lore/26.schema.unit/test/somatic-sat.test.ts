import { describe, expect, it } from 'vitest'
import { solveHandCapacitySAT } from '../../12.gear.unit/buz/gear.buzz'
import { solveSomaticSAT } from '../buz/somatic-sat.buzz'
import { SchemaModel } from '../schema.model'

describe('26.schema.unit: Somatic Limb Constraint SAT Gauntlet', () => {
    it('permits characters with 2 functional arms to hold two 1-hand props', () => {
        const somatic = { total_arms: 2, impairment_penalty_arms: 0 }
        const held = [
            { id: 'item_spoon', occupies_hands: 1 },
            { id: 'item_flint', occupies_hands: 1 },
        ]

        const res = solveHandCapacitySAT(somatic, held)
        expect(res.valid).toBe(true)
        expect(res.available_arms).toBe(2)
        expect(res.occupied_hands).toBe(2)
    })

    it('permits a 2-hand prop on 2 functional arms', () => {
        const somatic = { total_arms: 2, impairment_penalty_arms: 0 }
        const held = [{ id: 'item_two_handed_chisel', occupies_hands: 2 }]

        const res = solveHandCapacitySAT(somatic, held)
        expect(res.valid).toBe(true)
        expect(res.available_arms).toBe(2)
        expect(res.occupied_hands).toBe(2)
    })

    it('fails closed when a character with 1 severed arm demands two 1-hand props', () => {
        const somatic = { total_arms: 2, impairment_penalty_arms: 1 } // 1 arm severed
        const held = [
            { id: 'item_spoon', occupies_hands: 1 },
            { id: 'item_flint', occupies_hands: 1 },
        ]

        const res = solveHandCapacitySAT(somatic, held)
        expect(res.valid).toBe(false)
        expect(res.available_arms).toBe(1)
        expect(res.occupied_hands).toBe(2)
        expect(res.error).toContain('HAND_CAPACITY_EXCEEDED')
    })

    it('fails closed when a character with 1 severed arm attempts to wield a 2-hand prop', () => {
        const somatic = { total_arms: 2, impairment_penalty_arms: 1 }
        const held = [{ id: 'item_two_handed_crowbar', occupies_hands: 2 }]

        const res = solveHandCapacitySAT(somatic, held)
        expect(res.valid).toBe(false)
        expect(res.available_arms).toBe(1)
        expect(res.occupied_hands).toBe(2)
        expect(res.error).toContain('HAND_CAPACITY_EXCEEDED')
    })

    it('clamps available arms to 0 under compound trauma penalties', () => {
        const somatic = { total_arms: 2, impairment_penalty_arms: 4 } // Overkill trauma
        const held = [{ id: 'item_spoon', occupies_hands: 1 }]

        const res = solveHandCapacitySAT(somatic, held)
        expect(res.valid).toBe(false)
        expect(res.available_arms).toBe(0)
        expect(res.occupied_hands).toBe(1)
    })

    it('reactive buzzer solveSomaticSAT returns [SOMATIC_OVERLOAD] and fails closed (val = -1)', async () => {
        const model = new SchemaModel()
        let receipt: any = null

        const bal: any = {
            idx: 'test_sat_buzzer_overload',
            dat: {
                character_id: 'char_wart',
                arms_available: 2,
                impairment_penalties: 1, // Net functional arms = 1
                held_primary: { id: 'item_spoon', occupies_hands: 1 },
                held_secondary: { id: 'item_thimble', occupies_hands: 1 }, // Total demanded = 2
            },
            slv: (res: any) => {
                receipt = res
            },
        }

        await solveSomaticSAT(model, bal, {} as any)

        expect(bal.val).toBe(-1)
        expect(bal.lst[0]).toContain('[SOMATIC_OVERLOAD]')
        expect(receipt.schBit.val).toBe(-1)
        expect(receipt.schBit.lst[0]).toContain(
            'demands 2 hands for held items, but only possesses 1 functional arm(s)',
        )
    })
})
