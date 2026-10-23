import { describe, it, expect } from 'vitest'
import {
    CharacterLogisticalVectorSchema,
    CharacterLogisticalVector,
    PossessionLogisticalVector,
} from '../val/logistic.val'
import {
    verifyHandSaturationSat,
    transferEquipSlot,
    assertMassConservation,
} from '../buz/logistic.buzz'

describe('04.logistic.unit :: Four-Tier Equipment Slot Allocator Schema', () => {
    const sampleOneHandedItem: PossessionLogisticalVector = {
        item_id: 'item_iron_knife',
        occupies_hands: 1,
        occupies_hands_bps: 10000,
        mass_grams: 150,
        weight_class: 'scrap',
        is_contested: false,
        allowed_slots: ['HELD_PRIMARY', 'HELD_OFFHAND', 'CACHED_LOCATION'],
    }

    const sampleSecondOneHandedItem: PossessionLogisticalVector = {
        item_id: 'item_tallow_candle',
        occupies_hands: 1,
        occupies_hands_bps: 10000,
        mass_grams: 50,
        weight_class: 'negligible',
        is_contested: false,
        allowed_slots: ['HELD_PRIMARY', 'HELD_OFFHAND', 'CACHED_LOCATION'],
    }

    const sampleTwoHandedItem: PossessionLogisticalVector = {
        item_id: 'item_heavy_sledge',
        occupies_hands: 2,
        occupies_hands_bps: 20000,
        mass_grams: 4500,
        weight_class: 'weight',
        is_contested: false,
        allowed_slots: ['HELD_PRIMARY', 'CACHED_LOCATION'],
    }

    it('validates a well-formed 4-tier CharacterLogisticalVectorSchema', () => {
        const raw = {
            entity_id: 'char_bog',
            worn: ['item_tallow_apron'],
            held: ['item_iron_knife'],
            carried: ['item_lockpick_wire'],
            cached: {
                loc_warm_pipe: ['item_spare_spring'],
            },
        }
        const parsed = CharacterLogisticalVectorSchema.parse(raw)
        expect(parsed.entity_id).toBe('char_bog')
        expect(parsed.worn).toHaveLength(1)
        expect(parsed.held).toHaveLength(1)
        expect(parsed.carried).toHaveLength(1)
        expect(parsed.cached.loc_warm_pipe).toHaveLength(1)
    })

    it('enforces partition capacity ceilings (max 4 worn, max 2 held, max 4 carried)', () => {
        const overflowHeld = {
            entity_id: 'char_bog',
            worn: [],
            held: ['item_one', 'item_two', 'item_three'],
            carried: [],
            cached: {},
        }
        expect(() =>
            CharacterLogisticalVectorSchema.parse(overflowHeld),
        ).toThrow()

        const overflowWorn = {
            entity_id: 'char_bog',
            worn: ['item_1', 'item_2', 'item_3', 'item_4', 'item_5'],
            held: [],
            carried: [],
            cached: {},
        }
        expect(() =>
            CharacterLogisticalVectorSchema.parse(overflowWorn),
        ).toThrow()
    })

    it('satisfies the Hand Capacity Invariant when holding 1 item with 1 available arm', () => {
        const audit = verifyHandSaturationSat({
            entity_id: 'char_wart',
            arms_available_bps: 10000, // 1.0 arm available
            held_items: [sampleOneHandedItem],
        })
        expect(audit.valid).toBe(true)
        expect(audit.demanded_hands_bps).toBe(10000)
    })

    it('rejects allocation when holding 2 items with only 1 available arm (T_0 = $0.00)', () => {
        const audit = verifyHandSaturationSat({
            entity_id: 'char_wart',
            arms_available_bps: 10000, // 1.0 arm available
            held_items: [sampleOneHandedItem, sampleSecondOneHandedItem],
        })
        expect(audit.valid).toBe(false)
        expect(audit.errorCode).toBe('HAND_CAPACITY_BREACH')
        expect(audit.demanded_hands_bps).toBe(20000)
    })

    it('rejects equipping a two-handed weapon for an amputee actor (10000 bps)', () => {
        const audit = verifyHandSaturationSat({
            entity_id: 'char_wart',
            arms_available_bps: 10000,
            held_items: [sampleTwoHandedItem],
        })
        expect(audit.valid).toBe(false)
        expect(audit.errorCode).toBe('HAND_CAPACITY_BREACH')
    })

    it('permits equipping a two-handed weapon for an intact actor (20000 bps)', () => {
        const audit = verifyHandSaturationSat({
            entity_id: 'char_bog',
            arms_available_bps: 20000,
            held_items: [sampleTwoHandedItem],
        })
        expect(audit.valid).toBe(true)
        expect(audit.demanded_hands_bps).toBe(20000)
    })

    it('executes transferEquipSlot while checking hand saturation', () => {
        const initialVector: CharacterLogisticalVector = {
            entity_id: 'char_wart',
            worn: [],
            held: [sampleOneHandedItem.item_id],
            carried: [sampleSecondOneHandedItem.item_id],
            cached: {},
        }

        const knownPossessions = {
            [sampleOneHandedItem.item_id]: sampleOneHandedItem,
            [sampleSecondOneHandedItem.item_id]: sampleSecondOneHandedItem,
        }

        // Wart has 1 arm available and is already holding 1 item.
        // Attempting to move carried item into held must fail.
        const failedTransfer = transferEquipSlot(
            initialVector,
            {
                entity_id: 'char_wart',
                item: sampleSecondOneHandedItem,
                source_partition: 'carried',
                target_partition: 'held',
                arms_available_bps: 10000,
            },
            knownPossessions,
        )
        expect(failedTransfer.success).toBe(false)
        expect(failedTransfer.errorCode).toBe('HAND_CAPACITY_BREACH')

        // Transferring carried item into worn must succeed
        const successfulTransfer = transferEquipSlot(
            initialVector,
            {
                entity_id: 'char_wart',
                item: sampleSecondOneHandedItem,
                source_partition: 'carried',
                target_partition: 'worn',
                arms_available_bps: 10000,
            },
            knownPossessions,
        )
        expect(successfulTransfer.success).toBe(true)
        expect(successfulTransfer.updated_vector?.worn).toContain(
            sampleSecondOneHandedItem.item_id,
        )
        expect(successfulTransfer.updated_vector?.carried).not.toContain(
            sampleSecondOneHandedItem.item_id,
        )
    })

    it('enforces spatial exclusivity and mass conservation across multiple entities', () => {
        const characters: Record<string, CharacterLogisticalVector> = {
            char_bog: {
                entity_id: 'char_bog',
                worn: [],
                held: ['item_shared_wrench'],
                carried: [],
                cached: {},
            },
            char_wart: {
                entity_id: 'char_wart',
                worn: [],
                held: ['item_shared_wrench'], // Spatial anomaly: duplicate item
                carried: [],
                cached: {},
            },
        }

        const audit = assertMassConservation(characters)
        expect(audit.valid).toBe(false)
        expect(audit.errorCode).toBe('MASS_CONSERVATION_BREACH')
        expect(audit.duplicate_items).toHaveLength(1)
    })
})
