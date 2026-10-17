import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LocalEnvironmentalLedger } from '../src/db/localEnvironmentalLedger.js'
import { MaterialFeasibilityGate } from '../src/linters/materialFeasibility.js'

describe('Ground-Truth Physical State: Local SQLite Material Feasibility Gate', () => {
    let ledger: LocalEnvironmentalLedger
    let gate: MaterialFeasibilityGate

    beforeEach(() => {
        ledger = new LocalEnvironmentalLedger(':memory:')
        gate = new MaterialFeasibilityGate(ledger)

        ledger.db
            .prepare(
                `
      INSERT INTO item_placements (item_id, carrier_type, carrier_id, room_id, slot_name, occupies_hands, is_secured, updated_at_tick, updated_at_ms)
      VALUES ('item_glass_vial', 'ACTOR_HELD', 'char_spleen', 'loc_pump_station', 'held_main', 1, 1, 1, 0);
    `,
            )
            .run()
    })

    afterEach(() => {
        ledger.close()
    })

    it('halts mechanical operation on oxidized metal tools with MECHANICAL_FAILURE_IMMUTABLE', () => {
        ledger.upsertMaterialState({
            item_id: 'item_rusted_winch',
            material_class: 'METALLIC',
            wetness_bps: 0,
            corrosion_bps: 9500, // Rust-seized (> 9000)
            structural_integrity_bps: 8000,
            damage_threshold_bps: 1000,
            combustibility_tier: 'IMMUNE',
            is_operable: true,
            updated_at_epoch: 0,
        })

        const result = gate.auditOperation({
            actor_id: 'char_bog',
            item_id: 'item_rusted_winch',
            operation_type: 'OPERATE_MECHANISM',
            applied_energy_bps: 1500,
        })

        expect(result.satisfiable).toBe(false)
        expect(result.errorCode).toBe('MECHANICAL_FAILURE_IMMUTABLE')
        expect(result.errorVector?.rule_id).toBe('MECHANICAL_FAILURE_IMMUTABLE')
        expect(result.errorVector?.offending_tokens).toContain(
            'corrosion_bps: 9500',
        )
    })

    it('halts ignition of submerged or wet objects with COMBUSTION_IMPOSSIBILITY_HALT', () => {
        ledger.upsertMaterialState({
            item_id: 'item_waterlogged_torch',
            material_class: 'ORGANIC_WOOD',
            wetness_bps: 5000, // Wet (> 3000)
            corrosion_bps: 0,
            structural_integrity_bps: 10000,
            damage_threshold_bps: 200,
            combustibility_tier: 'IMMUNE',
            is_operable: true,
            updated_at_epoch: 0,
        })

        const result = gate.auditOperation({
            actor_id: 'char_silas',
            item_id: 'item_waterlogged_torch',
            operation_type: 'IGNITE',
            applied_energy_bps: 100,
        })

        expect(result.satisfiable).toBe(false)
        expect(result.errorCode).toBe('COMBUSTION_IMPOSSIBILITY_HALT')
        expect(result.errorVector?.rule_id).toBe(
            'COMBUSTION_IMPOSSIBILITY_HALT',
        )
    })

    it('executes brittle shatter dynamics and spawns debris shards in local SQLite', () => {
        ledger.upsertMaterialState({
            item_id: 'item_glass_vial',
            material_class: 'GLASS_CERAMIC',
            wetness_bps: 0,
            corrosion_bps: 0,
            structural_integrity_bps: 3000,
            damage_threshold_bps: 200,
            combustibility_tier: 'IMMUNE',
            is_operable: true,
            updated_at_epoch: 0,
        })

        // Drop onto stone floor with 2500 bps impact energy
        const result = gate.evaluateImpactDrop({
            actor_id: 'char_spleen',
            item_id: 'item_glass_vial',
            room_id: 'loc_pump_station',
            surface_material: 'STONE',
            impact_energy_bps: 2500,
            current_tick: 10,
        })

        expect(result.satisfiable).toBe(false)
        expect(result.errorCode).toBe('BRITTLE_SHATTER_HALT')
        expect(result.spawnedDebrisId).toBe('item_glass_vial_shards')

        // Verify target item destroyed in SQLite
        const originalItem = ledger.getMaterialState('item_glass_vial')
        expect(originalItem?.structural_integrity_bps).toBe(0)
        expect(originalItem?.is_operable).toBe(false)

        // Verify debris shards registered and resting on room surface
        const debrisState = ledger.getMaterialState('item_glass_vial_shards')
        expect(debrisState).toBeDefined()

        const placement = ledger.db
            .prepare(
                "SELECT * FROM item_placements WHERE item_id = 'item_glass_vial_shards'",
            )
            .get() as {
            carrier_type: string
            room_id: string
            slot_name: string
        }

        expect(placement.carrier_type).toBe('ROOM_SURFACE')
        expect(placement.room_id).toBe('loc_pump_station')
        expect(placement.slot_name).toBe('FLOOR_DEBRIS')

        // Subsequent operation on the shattered vial must fail with ZERO_INTEGRITY_HALT
        const postShatterOp = gate.auditOperation({
            actor_id: 'char_spleen',
            item_id: 'item_glass_vial',
            operation_type: 'OPERATE_MECHANISM',
            applied_energy_bps: 500,
        })

        expect(postShatterOp.satisfiable).toBe(false)
        expect(postShatterOp.errorCode).toBe('ZERO_INTEGRITY_HALT')
    })

    it('permits fragile item drops on soft surfaces without shatter', () => {
        ledger.upsertMaterialState({
            item_id: 'item_ceramic_mug',
            material_class: 'GLASS_CERAMIC',
            wetness_bps: 0,
            corrosion_bps: 0,
            structural_integrity_bps: 4000,
            damage_threshold_bps: 200,
            combustibility_tier: 'IMMUNE',
            is_operable: true,
            updated_at_epoch: 0,
        })

        const result = gate.evaluateImpactDrop({
            actor_id: 'char_wart',
            item_id: 'item_ceramic_mug',
            room_id: 'loc_canal_bank',
            surface_material: 'MUD', // Soft surface
            impact_energy_bps: 2500,
            current_tick: 11,
        })

        expect(result.satisfiable).toBe(true)

        const intactItem = ledger.getMaterialState('item_ceramic_mug')
        expect(intactItem?.structural_integrity_bps).toBe(4000)
        expect(intactItem?.is_operable).toBe(true)
    })
})
