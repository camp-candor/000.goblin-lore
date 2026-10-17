import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LocalSpatialSomaticLedger } from '../src/db/localSpatialSomaticLedger.js'

describe('Ground-Truth Physical State: Local SQLite Physical Entity Ledger', () => {
    let ledger: LocalSpatialSomaticLedger

    beforeEach(() => {
        ledger = new LocalSpatialSomaticLedger(':memory:')
        ledger.registerRoom('loc_culvert', 'Drainage Culvert', 5)
        ledger.registerRoom('loc_pump_house', 'Pump House', 5)
        ledger.registerRoom('loc_sealed_vault', 'Sealed Machinery Vault', 2)

        ledger.registerPortal({
            from_room_id: 'loc_culvert',
            to_room_id: 'loc_pump_house',
            portal_status: 'OPEN',
            traversal_cost_ticks: 1,
        })

        ledger.registerPortal({
            from_room_id: 'loc_pump_house',
            to_room_id: 'loc_sealed_vault',
            portal_status: 'LOCKED',
            traversal_cost_ticks: 2,
        })
    })

    afterEach(() => {
        ledger.close()
    })

    it('enforces axial hex cube invariant on actor staging', () => {
        expect(() => {
            ledger.upsertEntity({
                id: 'char_bog',
                room_id: 'loc_culvert',
                coord_q: 1,
                coord_r: 1,
                coord_s: 1, // 1 + 1 + 1 != 0
                scale: 'STAGED',
                vitality_bps: 10000,
                consciousness_status: 'AWAKE',
                available_arms: 2,
                locomotion_tier: 'bipedal_standard',
                updated_at_tick: 0,
                updated_at_ms: 0,
            })
        }).toThrow()
    })

    it('executes valid topological movement and migrates carried inventory', () => {
        ledger.upsertEntity({
            id: 'char_silas',
            room_id: 'loc_culvert',
            coord_q: 1,
            coord_r: -1,
            coord_s: 0,
            scale: 'STAGED',
            vitality_bps: 10000,
            consciousness_status: 'AWAKE',
            available_arms: 2,
            locomotion_tier: 'bipedal_standard',
            updated_at_tick: 1,
            updated_at_ms: 0,
        })

        ledger.upsertItem({
            item_id: 'item_siphon',
            carrier_type: 'ACTOR_HELD',
            carrier_id: 'char_silas',
            room_id: 'loc_culvert',
            occupies_hands: 1,
            is_secured: 1,
            updated_at_tick: 1,
            updated_at_ms: 0,
        })

        // Move to connected open room
        ledger.recordPhysicalMove('char_silas', 'loc_pump_house', 2)

        const actor = ledger.getEntity('char_silas')
        const item = ledger.getItem('item_siphon')

        expect(actor?.room_id).toBe('loc_pump_house')
        expect(item?.room_id).toBe('loc_pump_house')
        expect(ledger.assertMassConservation()).toBe(true)
    })

    it('halts closed on non-adjacent or locked portal movements', () => {
        ledger.upsertEntity({
            id: 'char_wart',
            room_id: 'loc_culvert',
            coord_q: 0,
            coord_r: 0,
            coord_s: 0,
            scale: 'STAGED',
            vitality_bps: 10000,
            consciousness_status: 'AWAKE',
            available_arms: 2,
            locomotion_tier: 'bipedal_standard',
            updated_at_tick: 1,
            updated_at_ms: 0,
        })

        // Non-adjacent jump (loc_culvert to loc_sealed_vault has no portal)
        expect(() => {
            ledger.recordPhysicalMove('char_wart', 'loc_sealed_vault', 2)
        }).toThrow(/ILLEGAL_TRANSIT_DISCONNECT/)

        // Move to pump house, then attempt locked portal
        ledger.recordPhysicalMove('char_wart', 'loc_pump_house', 2)
        expect(() => {
            ledger.recordPhysicalMove('char_wart', 'loc_sealed_vault', 3)
        }).toThrow(/PORTAL_BLOCKED_HALT/)
    })

    it('enforces co-presence and hand capacity on item transfer', () => {
        ledger.upsertEntity({
            id: 'char_bog',
            room_id: 'loc_culvert',
            coord_q: 0,
            coord_r: 0,
            coord_s: 0,
            scale: 'STAGED',
            vitality_bps: 10000,
            consciousness_status: 'AWAKE',
            available_arms: 1, // Only 1 arm
            locomotion_tier: 'bipedal_standard',
            updated_at_tick: 1,
            updated_at_ms: 0,
        })

        ledger.upsertItem({
            item_id: 'item_two_handed_cutter',
            carrier_type: 'ROOM_SURFACE',
            carrier_id: 'loc_culvert',
            room_id: 'loc_culvert',
            occupies_hands: 2, // Requires 2 hands
            is_secured: 1,
            updated_at_tick: 1,
            updated_at_ms: 0,
        })

        // Demands 2 hands but Bog only has 1 arm -> must halt
        expect(() => {
            ledger.transferItem(
                'item_two_handed_cutter',
                'char_bog',
                'ACTOR_HELD',
                2,
            )
        }).toThrow(/SOMATIC_CAPACITY_EXCEEDED/)
    })

    it('automatically ejects held items to room surface upon somatic limb loss', () => {
        ledger.upsertEntity({
            id: 'char_spleen',
            room_id: 'loc_culvert',
            coord_q: 0,
            coord_r: 0,
            coord_s: 0,
            scale: 'STAGED',
            vitality_bps: 10000,
            consciousness_status: 'AWAKE',
            available_arms: 2,
            locomotion_tier: 'bipedal_standard',
            updated_at_tick: 1,
            updated_at_ms: 0,
        })

        ledger.upsertItem({
            item_id: 'item_heavy_wrench',
            carrier_type: 'ACTOR_HELD',
            carrier_id: 'char_spleen',
            room_id: 'loc_culvert',
            occupies_hands: 1,
            is_secured: 1,
            updated_at_tick: 1,
            updated_at_ms: 0,
        })

        ledger.upsertItem({
            item_id: 'item_lantern',
            carrier_type: 'ACTOR_HELD',
            carrier_id: 'char_spleen',
            room_id: 'loc_culvert',
            occupies_hands: 1,
            is_secured: 1,
            updated_at_tick: 1,
            updated_at_ms: 0,
        })

        // Inflict arm injury (2 arms -> 1 arm)
        ledger.applySomaticTrauma('char_spleen', 1, 7000, 'limping', 2)

        const roomState = ledger.queryRoomState('loc_culvert')
        const heldItems = roomState.items.filter(
            (it) => it.carrier_type === 'ACTOR_HELD',
        )
        const floorItems = roomState.items.filter(
            (it) => it.carrier_type === 'ROOM_SURFACE',
        )

        expect(heldItems).toHaveLength(1)
        expect(floorItems).toHaveLength(1)
        expect(ledger.assertMassConservation()).toBe(true)
    })

    it('prevents incapacitated actors from altering spatial position via native trigger', () => {
        ledger.upsertEntity({
            id: 'char_unconscious_scout',
            room_id: 'loc_culvert',
            coord_q: 0,
            coord_r: 0,
            coord_s: 0,
            scale: 'STAGED',
            vitality_bps: 1000,
            consciousness_status: 'UNCONSCIOUS',
            available_arms: 2,
            locomotion_tier: 'immobilized',
            updated_at_tick: 1,
            updated_at_ms: 0,
        })

        expect(() => {
            ledger.recordPhysicalMove(
                'char_unconscious_scout',
                'loc_pump_house',
                2,
            )
        }).toThrow(/PHYSICAL_LEDGER/)
    })
})
