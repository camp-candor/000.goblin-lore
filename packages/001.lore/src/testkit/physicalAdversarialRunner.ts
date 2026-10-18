import Database from 'better-sqlite3'
import {
    TeleportationAttackPayload,
    GhostGraspAttackPayload,
    PostMortemAttackPayload,
    MuteUtteranceAttackPayload,
    MaterialImmunityAttackPayload,
} from './syntheticHallucinationGenerator.js'

export interface ErrorSignatureVector {
    domain: 'PHYSICAL_STATE'
    target_entity: string
    rule_id:
        | 'SPATIAL_DISJOINTNESS_BREACH'
        | 'MASS_CONSERVATION_BREACH'
        | 'POST_MORTEM_ACTION_BREACH'
        | 'VOCAL_FEASIBILITY_BREACH'
        | 'COMBUSTION_IMPOSSIBILITY_HALT'
    offending_tokens: string[]
}

export interface TrapExecutionResult {
    trap_id: string
    intercepted: boolean
    latency_ms: number
    error_vector?: ErrorSignatureVector
    diagnostic_message?: string
}

export class PhysicalAdversarialRunner {
    private db: Database.Database

    constructor(dbPath: string = ':memory:') {
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON')
        this.initDatabaseSchema()
    }

    private initDatabaseSchema(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        is_submerged INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS room_portals (
        from_room_id TEXT NOT NULL,
        to_room_id TEXT NOT NULL,
        is_passable INTEGER NOT NULL DEFAULT 1,
        PRIMARY KEY (from_room_id, to_room_id),
        FOREIGN KEY (from_room_id) REFERENCES rooms(id) ON DELETE CASCADE,
        FOREIGN KEY (to_room_id) REFERENCES rooms(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS entities_physical (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location_id TEXT NOT NULL,
        vitality_bps INTEGER NOT NULL CHECK(vitality_bps BETWEEN 0 AND 10000),
        consciousness_status TEXT CHECK(consciousness_status IN ('AWAKE', 'STUNNED', 'UNCONSCIOUS', 'DECEASED')) NOT NULL,
        active_conditions TEXT NOT NULL DEFAULT '[]',
        FOREIGN KEY (location_id) REFERENCES rooms(id)
      );

      CREATE TABLE IF NOT EXISTS item_placements (
        item_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        carrier_type TEXT CHECK(carrier_type IN ('ROOM', 'ACTOR_SLOT')) NOT NULL,
        carrier_id TEXT NOT NULL,
        slot_name TEXT,
        wetness_bps INTEGER NOT NULL DEFAULT 0 CHECK(wetness_bps BETWEEN 0 AND 10000),
        combustibility_tier TEXT CHECK(combustibility_tier IN ('IMMUNE', 'IGNITABLE', 'HIGHLY_VOLATILE')) NOT NULL DEFAULT 'IGNITABLE'
      );
    `)
    }

    public seedBaselinePhysicalReality(): void {
        // 1. Seed Rooms
        this.db
            .prepare(
                "INSERT INTO rooms VALUES ('loc_culvert', 'Culvert Sump', 0)",
            )
            .run()
        this.db
            .prepare(
                "INSERT INTO rooms VALUES ('loc_pump_house', 'Pump House', 0)",
            )
            .run()
        this.db
            .prepare("INSERT INTO rooms VALUES ('loc_attic', 'Attic Loft', 0)")
            .run()
        this.db
            .prepare(
                "INSERT INTO rooms VALUES ('loc_flooded_sump', 'Flooded Sump', 1)",
            )
            .run()

        // 2. Seed Portals (Culvert <-> Pump House <-> Attic; Culvert is NOT connected directly to Attic)
        this.db
            .prepare(
                "INSERT INTO room_portals VALUES ('loc_culvert', 'loc_pump_house', 1)",
            )
            .run()
        this.db
            .prepare(
                "INSERT INTO room_portals VALUES ('loc_pump_house', 'loc_culvert', 1)",
            )
            .run()
        this.db
            .prepare(
                "INSERT INTO room_portals VALUES ('loc_pump_house', 'loc_attic', 1)",
            )
            .run()
        this.db
            .prepare(
                "INSERT INTO room_portals VALUES ('loc_attic', 'loc_pump_house', 1)",
            )
            .run()

        // 3. Seed Actors
        this.db
            .prepare(
                `
      INSERT INTO entities_physical VALUES
        ('char_wart', 'Wart', 'loc_culvert', 10000, 'AWAKE', '[]'),
        ('char_bog', 'Bog', 'loc_culvert', 10000, 'AWAKE', '[]'),
        ('char_silas', 'Silas', 'loc_pump_house', 6000, 'AWAKE', '["cond_severed_trachea"]'),
        ('char_mum_grissel', 'Mum Grissel', 'loc_attic', 0, 'DECEASED', '["cond_fatal_wound"]')
    `,
            )
            .run()

        // 4. Seed Items
        this.db
            .prepare(
                `
      INSERT INTO item_placements VALUES
        ('item_brass_siphon', 'Brass Siphon', 'ACTOR_SLOT', 'char_bog', 'held', 500, 'IMMUNE'),
        ('item_matches', 'Sulfur Matches', 'ACTOR_SLOT', 'char_bog', 'held', 8500, 'IGNITABLE')
    `,
            )
            .run()
    }

    /**
     * Evaluates Trap 1: Teleportation Attack
     */
    public evaluateTeleportation(
        payload: TeleportationAttackPayload,
    ): TrapExecutionResult {
        const start = performance.now()
        const portal = this.db
            .prepare(
                `
      SELECT is_passable FROM room_portals
      WHERE from_room_id = ? AND to_room_id = ?
    `,
            )
            .get(payload.source_room_id, payload.target_room_id) as
            { is_passable: number } | undefined

        const latency = performance.now() - start

        if (!portal || portal.is_passable !== 1) {
            return {
                trap_id: 'TRAP_1_TELEPORTATION',
                intercepted: true,
                latency_ms: latency,
                diagnostic_message: `SPATIAL_DISJOINTNESS_BREACH: Actor '${payload.actor_id}' attempted teleportation from '${payload.source_room_id}' to '${payload.target_room_id}' without portal edge.`,
                error_vector: {
                    domain: 'PHYSICAL_STATE',
                    target_entity: payload.actor_id,
                    rule_id: 'SPATIAL_DISJOINTNESS_BREACH',
                    offending_tokens: [
                        payload.source_room_id,
                        payload.target_room_id,
                    ],
                },
            }
        }

        return {
            trap_id: 'TRAP_1_TELEPORTATION',
            intercepted: false,
            latency_ms: latency,
        }
    }

    /**
     * Evaluates Trap 2: Ghost Grasp Attack
     */
    public evaluateGhostGrasp(
        payload: GhostGraspAttackPayload,
    ): TrapExecutionResult {
        const start = performance.now()
        const item = this.db
            .prepare(
                `
      SELECT carrier_type, carrier_id, slot_name FROM item_placements WHERE item_id = ?
    `,
            )
            .get(payload.target_item_id) as
            | { carrier_type: string; carrier_id: string; slot_name: string }
            | undefined

        const latency = performance.now() - start

        if (!item) {
            return {
                trap_id: 'TRAP_2_GHOST_GRASP',
                intercepted: true,
                latency_ms: latency,
            }
        }

        if (
            item.carrier_type === 'ACTOR_SLOT' &&
            item.carrier_id !== payload.actor_id
        ) {
            return {
                trap_id: 'TRAP_2_GHOST_GRASP',
                intercepted: true,
                latency_ms: latency,
                diagnostic_message: `MASS_CONSERVATION_BREACH: Item '${payload.target_item_id}' is secured by '${item.carrier_id}' in slot '${item.slot_name}'. Direct equip by '${payload.actor_id}' blocked.`,
                error_vector: {
                    domain: 'PHYSICAL_STATE',
                    target_entity: payload.actor_id,
                    rule_id: 'MASS_CONSERVATION_BREACH',
                    offending_tokens: [payload.target_item_id, item.carrier_id],
                },
            }
        }

        return {
            trap_id: 'TRAP_2_GHOST_GRASP',
            intercepted: false,
            latency_ms: latency,
        }
    }

    /**
     * Evaluates Trap 3: Post-Mortem Action Attack
     */
    public evaluatePostMortem(
        payload: PostMortemAttackPayload,
    ): TrapExecutionResult {
        const start = performance.now()
        const actor = this.db
            .prepare(
                `
      SELECT vitality_bps, consciousness_status FROM entities_physical WHERE id = ?
    `,
            )
            .get(payload.actor_id) as
            { vitality_bps: number; consciousness_status: string } | undefined

        const latency = performance.now() - start

        if (!actor) {
            return {
                trap_id: 'TRAP_3_POST_MORTEM',
                intercepted: true,
                latency_ms: latency,
            }
        }

        if (
            actor.vitality_bps === 0 ||
            actor.consciousness_status === 'DECEASED'
        ) {
            return {
                trap_id: 'TRAP_3_POST_MORTEM',
                intercepted: true,
                latency_ms: latency,
                diagnostic_message: `POST_MORTEM_ACTION_BREACH: Entity '${payload.actor_id}' is DECEASED (vitality: ${actor.vitality_bps} bps). Motor/verbal action blocked.`,
                error_vector: {
                    domain: 'PHYSICAL_STATE',
                    target_entity: payload.actor_id,
                    rule_id: 'POST_MORTEM_ACTION_BREACH',
                    offending_tokens: [
                        payload.attempted_action,
                        actor.consciousness_status,
                    ],
                },
            }
        }

        return {
            trap_id: 'TRAP_3_POST_MORTEM',
            intercepted: false,
            latency_ms: latency,
        }
    }

    /**
     * Evaluates Trap 4: Mute Utterance Attack
     */
    public evaluateMuteUtterance(
        payload: MuteUtteranceAttackPayload,
    ): TrapExecutionResult {
        const start = performance.now()
        const actor = this.db
            .prepare(
                `
      SELECT active_conditions FROM entities_physical WHERE id = ?
    `,
            )
            .get(payload.actor_id) as { active_conditions: string } | undefined

        const latency = performance.now() - start

        if (!actor) {
            return {
                trap_id: 'TRAP_4_MUTE_UTTERANCE',
                intercepted: true,
                latency_ms: latency,
            }
        }

        const conditions = JSON.parse(actor.active_conditions) as string[]
        const isMute =
            conditions.includes('cond_severed_trachea') ||
            conditions.includes('cond_crushed_larynx')

        if (isMute && payload.dialogue_text.trim().length > 0) {
            return {
                trap_id: 'TRAP_4_MUTE_UTTERANCE',
                intercepted: true,
                latency_ms: latency,
                diagnostic_message: `VOCAL_FEASIBILITY_BREACH: Actor '${payload.actor_id}' has active vocal-tract trauma. Spoken dialogue lines prohibited.`,
                error_vector: {
                    domain: 'PHYSICAL_STATE',
                    target_entity: payload.actor_id,
                    rule_id: 'VOCAL_FEASIBILITY_BREACH',
                    offending_tokens: [
                        payload.dialogue_text,
                        'cond_severed_trachea',
                    ],
                },
            }
        }

        return {
            trap_id: 'TRAP_4_MUTE_UTTERANCE',
            intercepted: false,
            latency_ms: latency,
        }
    }

    /**
     * Evaluates Trap 5: Material Immunity Attack
     */
    public evaluateMaterialImmunity(
        payload: MaterialImmunityAttackPayload,
    ): TrapExecutionResult {
        const start = performance.now()
        const item = this.db
            .prepare(
                `
      SELECT wetness_bps, combustibility_tier FROM item_placements WHERE item_id = ?
    `,
            )
            .get(payload.item_id) as
            { wetness_bps: number; combustibility_tier: string } | undefined

        const latency = performance.now() - start

        if (!item) {
            return {
                trap_id: 'TRAP_5_MATERIAL_IMMUNITY',
                intercepted: true,
                latency_ms: latency,
            }
        }

        // Material Invariant: wetness > 3000 bps forces combustibility to IMMUNE
        const effectiveCombustibility =
            item.wetness_bps > 3000 ? 'IMMUNE' : item.combustibility_tier

        if (
            payload.attempted_action === 'IGNITE' &&
            effectiveCombustibility === 'IMMUNE'
        ) {
            return {
                trap_id: 'TRAP_5_MATERIAL_IMMUNITY',
                intercepted: true,
                latency_ms: latency,
                diagnostic_message: `COMBUSTION_IMPOSSIBILITY_HALT: Item '${payload.item_id}' wetness is ${item.wetness_bps} bps (>3000 bps). Combustion impossible.`,
                error_vector: {
                    domain: 'PHYSICAL_STATE',
                    target_entity: payload.item_id,
                    rule_id: 'COMBUSTION_IMPOSSIBILITY_HALT',
                    offending_tokens: [
                        `wetness_${item.wetness_bps}_bps`,
                        'IGNITE',
                    ],
                },
            }
        }

        return {
            trap_id: 'TRAP_5_MATERIAL_IMMUNITY',
            intercepted: false,
            latency_ms: latency,
        }
    }

    public close(): void {
        this.db.close()
    }
}
