import { describe, it, expect } from 'vitest'
import { solveHandCapacitySAT } from '../buz/gear.buzz.js'
import {
    CharacterLogisticalVectorSchema,
    EquipSlotSchema,
    EquipSlotTypeEnum,
} from '../fce/slot.schema.js'

describe('12.gear.unit - Hand Capacity Invariant', () => {
    it('validates default slot layout and rejects un-schemaed keys', () => {
        const valid = {
            worn: {
                head: 'item_tin_cap',
                chest: 'item_quilted_tunic',
            },
            held_primary: 'item_silver_spoon',
            held_secondary: null,
            carried: ['item_flint_flake'],
            cached: ['item_spare_nails'],
            max_carry_mass_g: 4500,
        }

        expect(CharacterLogisticalVectorSchema.safeParse(valid).success).toBe(
            true,
        )

        const extraKeys = {
            ...valid,
            bag_of_holding: ['item_unlimited_props'],
        }
        const rejected = CharacterLogisticalVectorSchema.safeParse(extraKeys)
        expect(rejected.success).toBe(false)
    })

    it('enforces the canonical equipment slot type vocabulary', () => {
        const slots = [
            'WORN_INNER',
            'WORN_OUTER',
            'HELD_PRIMARY',
            'HELD_OFFHAND',
            'SLUNG_SHOULDER',
            'POCKET_STORAGE',
            'CACHED_ROOM',
        ]
        for (const slot of slots) {
            expect(EquipSlotTypeEnum.safeParse(slot).success).toBe(true)
        }
        expect(EquipSlotTypeEnum.safeParse('BAG_OF_HOLDING').success).toBe(
            false,
        )

        const parsed = EquipSlotSchema.parse({
            slot_type: 'HELD_PRIMARY',
            item_id: 'item_silver_spoon',
            occupies_hands: 1,
        })
        expect(parsed.slot_type).toBe('HELD_PRIMARY')
        expect(
            EquipSlotSchema.safeParse({
                slot_type: 'HELD_PRIMARY',
                item_id: 'item_silver_spoon',
                occupies_hands: 3,
            }).success,
        ).toBe(false)
    })

    it('permits two 1-handed items on 2 intact limbs', () => {
        const somatic = { total_arms: 2, impairment_penalty_arms: 0 }
        const heldItems = [
            { id: 'item_silver_spoon', occupies_hands: 1 },
            { id: 'item_dented_thimble', occupies_hands: 1 },
        ]

        const result = solveHandCapacitySAT(somatic, heldItems)
        expect(result.valid).toBe(true)
        expect(result.available_arms).toBe(2)
        expect(result.occupied_hands).toBe(2)
    })

    it('rejects 2 hands demanded on a character with 1 severed limb', () => {
        const somatic = { total_arms: 2, impairment_penalty_arms: 1 }
        const heldItems = [
            { id: 'item_grease_pot', occupies_hands: 1 },
            { id: 'item_iron_chisel', occupies_hands: 1 },
        ]

        const result = solveHandCapacitySAT(somatic, heldItems)
        expect(result.valid).toBe(false)
        expect(result.available_arms).toBe(1)
        expect(result.occupied_hands).toBe(2)
        expect(result.error).toBeTruthy()
        expect(result.error ?? '').toContain('HAND_CAPACITY_EXCEEDED')
    })

    it('clamps compound trauma to prevent negative limb capacity', () => {
        const somatic = { total_arms: 2, impairment_penalty_arms: 3 }
        const heldItems = [{ id: 'item_scrap_pebble', occupies_hands: 1 }]

        const result = solveHandCapacitySAT(somatic, heldItems)
        expect(result.valid).toBe(false)
        expect(result.available_arms).toBe(0)
    })
})
