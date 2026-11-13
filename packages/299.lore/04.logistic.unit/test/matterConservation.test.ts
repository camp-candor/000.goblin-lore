import { describe, it, expect } from 'vitest'
import { reconcileRetiredEntityPossessions } from '../buz/matterConservation.buzz.js'
import type { PossessionLogisticalVector } from '../val/logistic.val.js'

describe('04.logistic.unit :: Physical Matter Conservation Allocator', () => {
    const brassKey: PossessionLogisticalVector = {
        item_id: 'item_brass_key',
        occupies_hands: 1,
        occupies_hands_bps: 10000,
        mass_grams: 120,
        weight_class: 'shine',
        is_contested: false,
        allowed_slots: ['HELD_PRIMARY', 'POCKET_STORAGE', 'CACHED_LOCATION'],
    }

    const heavySledge: PossessionLogisticalVector = {
        item_id: 'item_heavy_sledge',
        occupies_hands: 2,
        occupies_hands_bps: 20000,
        mass_grams: 4500,
        weight_class: 'weight',
        is_contested: false,
        allowed_slots: ['HELD_PRIMARY', 'CACHED_LOCATION'],
    }

    const ironKnife: PossessionLogisticalVector = {
        item_id: 'item_iron_knife',
        occupies_hands: 1,
        occupies_hands_bps: 10000,
        mass_grams: 150,
        weight_class: 'scrap',
        is_contested: false,
        allowed_slots: ['HELD_PRIMARY', 'HELD_OFFHAND'],
    }

    it('reconciles retired entity possessions via valid character transfer and spatial location drop', () => {
        const receipt = reconcileRetiredEntityPossessions({
            retiring_entity_id: 'char_old_snag',
            held_possessions: [brassKey, heavySledge],
            item_transfers: [
                {
                    item_id: 'item_brass_key',
                    disposition_type: 'TRANSFER_TO_CHARACTER',
                    recipient_character_id: 'char_wart',
                    target_partition: 'held',
                },
                {
                    item_id: 'item_heavy_sledge',
                    disposition_type: 'DROP_AT_LOCATION',
                    recipient_character_id: null,
                    drop_location_id: 'loc_culvert_siphon',
                },
            ],
            active_characters: {
                char_wart: {
                    arms_available_bps: 10000,
                    vector: {
                        entity_id: 'char_wart',
                        worn: [],
                        held: [],
                        carried: [],
                        cached: {},
                    },
                },
            },
            valid_location_ids: ['loc_culvert_siphon'],
            known_possessions: {
                item_brass_key: brassKey,
                item_heavy_sledge: heavySledge,
            },
        })

        expect(receipt.valid).toBe(true)
        expect(receipt.total_items_accounted).toBe(2)
        expect(receipt.transferred_count).toBe(1)
        expect(receipt.dropped_count).toBe(1)
        expect(receipt.updated_character_vectors.char_wart.held).toContain(
            'item_brass_key',
        )
        expect(receipt.updated_possession_states).toContainEqual({
            item_id: 'item_heavy_sledge',
            owner_id: null,
            location_id: 'loc_culvert_siphon',
        })
    })

    it('aborts with DANGLING_RETIRED_CUSTODY_BREACH if any held possession is omitted from item_transfers', () => {
        const receipt = reconcileRetiredEntityPossessions({
            retiring_entity_id: 'char_old_snag',
            held_possessions: [brassKey, heavySledge],
            item_transfers: [
                {
                    item_id: 'item_brass_key',
                    disposition_type: 'DROP_AT_LOCATION',
                    recipient_character_id: null,
                    drop_location_id: 'loc_culvert_siphon',
                },
            ],
            active_characters: {},
            valid_location_ids: ['loc_culvert_siphon'],
            known_possessions: {
                item_brass_key: brassKey,
                item_heavy_sledge: heavySledge,
            },
        })

        expect(receipt.valid).toBe(false)
        expect(receipt.errorCode).toBe('DANGLING_RETIRED_CUSTODY_BREACH')
        expect(receipt.errors[0]).toContain('item_heavy_sledge')
    })

    it('aborts with HAND_CAPACITY_BREACH when recipient arms are overloaded by transfer', () => {
        const receipt = reconcileRetiredEntityPossessions({
            retiring_entity_id: 'char_old_snag',
            held_possessions: [brassKey],
            item_transfers: [
                {
                    item_id: 'item_brass_key',
                    disposition_type: 'TRANSFER_TO_CHARACTER',
                    recipient_character_id: 'char_wart',
                    target_partition: 'held',
                },
            ],
            active_characters: {
                char_wart: {
                    arms_available_bps: 10000,
                    vector: {
                        entity_id: 'char_wart',
                        worn: [],
                        held: ['item_iron_knife'],
                        carried: [],
                        cached: {},
                    },
                },
            },
            valid_location_ids: ['loc_culvert_siphon'],
            known_possessions: {
                item_brass_key: brassKey,
                item_iron_knife: ironKnife,
            },
        })

        expect(receipt.valid).toBe(false)
        expect(receipt.errorCode).toBe('HAND_CAPACITY_BREACH')
        expect(receipt.errors[0]).toContain('[MATTER_CONSERVATION_BREACH]')
    })

    it('aborts with MATTER_CONSERVATION_BREACH when dropping at an invalid location ID', () => {
        const receipt = reconcileRetiredEntityPossessions({
            retiring_entity_id: 'char_old_snag',
            held_possessions: [heavySledge],
            item_transfers: [
                {
                    item_id: 'item_heavy_sledge',
                    disposition_type: 'DROP_AT_LOCATION',
                    recipient_character_id: null,
                    drop_location_id: 'loc_unauthored_void',
                },
            ],
            active_characters: {},
            valid_location_ids: ['loc_culvert_siphon'],
            known_possessions: {
                item_heavy_sledge: heavySledge,
            },
        })

        expect(receipt.valid).toBe(false)
        expect(receipt.errorCode).toBe('MATTER_CONSERVATION_BREACH')
        expect(receipt.errors[0]).toContain('loc_unauthored_void')
    })
})
