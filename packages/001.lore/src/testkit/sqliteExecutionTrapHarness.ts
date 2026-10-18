import Database from 'better-sqlite3'
import { pathToFileURL } from 'node:url'
import {
    SyntheticHallucinationGenerator,
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

export interface TrapResult {
    trap_id: string
    rule_id: ErrorSignatureVector['rule_id']
    intercepted: boolean
    latency_ms: number
    diagnostic: string
    error_vector?: ErrorSignatureVector
}

export interface HarnessExecutionReport {
    total_traps: number
    intercepted_count: number
    interception_rate_pct: number
    all_intercepted: boolean
    total_latency_ms: number
    average_latency_ms: number
    sub_10ms_benchmark_passed: boolean
    trap_results: TrapResult[]
}

export class SqliteExecutionTrapHarness {
    private db: Database.Database

    constructor(dbPath: string = ':memory:') {
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON')
        this.initSchema()
        this.seedBaseline()
    }

    private initSchema(): void {
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

    public seedBaseline(): void {
        // 1. Clear existing rows
        this.db.prepare('DELETE FROM item_placements').run()
        this.db.prepare('DELETE FROM entities_physical').run()
        this.db.prepare('DELETE FROM room_portals').run()
        this.db.prepare('DELETE FROM rooms').run()

        // 2. Insert Rooms
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

        // 3. Insert Portals (Culvert <-> Pump House <-> Attic; Culvert is NOT connected to Attic)
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

        // 4. Insert Entities
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

        // 5. Insert Possessions
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

    public runTrap1Teleportation(
        attack?: TeleportationAttackPayload,
    ): TrapResult {
        const payload =
            attack ||
            SyntheticHallucinationGenerator.generateTeleportationAttack()
        const t0 = performance.now()

        this.db.exec('SAVEPOINT trap1_eval;')
        try {
            const portal = this.db
                .prepare(
                    `
        SELECT is_passable FROM room_portals
        WHERE from_room_id = ? AND to_room_id = ?
      `,
                )
                .get(payload.source_room_id, payload.target_room_id) as
                { is_passable: number } | undefined

            const isBlocked = !portal || portal.is_passable !== 1
            const latency = performance.now() - t0

            if (isBlocked) {
                return {
                    trap_id: 'TRAP_1_TELEPORTATION',
                    rule_id: 'SPATIAL_DISJOINTNESS_BREACH',
                    intercepted: true,
                    latency_ms: latency,
                    diagnostic: `SPATIAL_DISJOINTNESS_BREACH: Actor '${payload.actor_id}' attempted illegal transit from '${payload.source_room_id}' to '${payload.target_room_id}'.`,
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
                rule_id: 'SPATIAL_DISJOINTNESS_BREACH',
                intercepted: false,
                latency_ms: latency,
                diagnostic: 'Transit permitted.',
            }
        } finally {
            this.db.exec('ROLLBACK TO trap1_eval;')
        }
    }

    public runTrap2GhostGrasp(attack?: GhostGraspAttackPayload): TrapResult {
        const payload =
            attack || SyntheticHallucinationGenerator.generateGhostGraspAttack()
        const t0 = performance.now()

        this.db.exec('SAVEPOINT trap2_eval;')
        try {
            const item = this.db
                .prepare(
                    `
        SELECT carrier_type, carrier_id, slot_name FROM item_placements WHERE item_id = ?
      `,
                )
                .get(payload.target_item_id) as
                | {
                      carrier_type: string
                      carrier_id: string
                      slot_name: string
                  }
                | undefined

            const latency = performance.now() - t0

            if (!item) {
                return {
                    trap_id: 'TRAP_2_GHOST_GRASP',
                    rule_id: 'MASS_CONSERVATION_BREACH',
                    intercepted: true,
                    latency_ms: latency,
                    diagnostic: `MASS_CONSERVATION_BREACH: Item '${payload.target_item_id}' not found in placement ledger.`,
                }
            }

            if (
                item.carrier_type === 'ACTOR_SLOT' &&
                item.carrier_id !== payload.actor_id
            ) {
                return {
                    trap_id: 'TRAP_2_GHOST_GRASP',
                    rule_id: 'MASS_CONSERVATION_BREACH',
                    intercepted: true,
                    latency_ms: latency,
                    diagnostic: `MASS_CONSERVATION_BREACH: Item '${payload.target_item_id}' is secured by '${item.carrier_id}' in slot '${item.slot_name}'. Direct equip by '${payload.actor_id}' blocked.`,
                    error_vector: {
                        domain: 'PHYSICAL_STATE',
                        target_entity: payload.actor_id,
                        rule_id: 'MASS_CONSERVATION_BREACH',
                        offending_tokens: [
                            payload.target_item_id,
                            item.carrier_id,
                        ],
                    },
                }
            }

            return {
                trap_id: 'TRAP_2_GHOST_GRASP',
                rule_id: 'MASS_CONSERVATION_BREACH',
                intercepted: false,
                latency_ms: latency,
                diagnostic: 'Item acquisition permitted.',
            }
        } finally {
            this.db.exec('ROLLBACK TO trap2_eval;')
        }
    }

    public runTrap3PostMortem(attack?: PostMortemAttackPayload): TrapResult {
        const payload =
            attack || SyntheticHallucinationGenerator.generatePostMortemAttack()
        const t0 = performance.now()

        this.db.exec('SAVEPOINT trap3_eval;')
        try {
            const actor = this.db
                .prepare(
                    `
        SELECT vitality_bps, consciousness_status FROM entities_physical WHERE id = ?
      `,
                )
                .get(payload.actor_id) as
                | { vitality_bps: number; consciousness_status: string }
                | undefined

            const latency = performance.now() - t0

            if (!actor) {
                return {
                    trap_id: 'TRAP_3_POST_MORTEM',
                    rule_id: 'POST_MORTEM_ACTION_BREACH',
                    intercepted: true,
                    latency_ms: latency,
                    diagnostic: `POST_MORTEM_ACTION_BREACH: Actor '${payload.actor_id}' not registered in physical ledger.`,
                }
            }

            if (
                actor.vitality_bps === 0 ||
                actor.consciousness_status === 'DECEASED'
            ) {
                return {
                    trap_id: 'TRAP_3_POST_MORTEM',
                    rule_id: 'POST_MORTEM_ACTION_BREACH',
                    intercepted: true,
                    latency_ms: latency,
                    diagnostic: `POST_MORTEM_ACTION_BREACH: Entity '${payload.actor_id}' is DECEASED (vitality: ${actor.vitality_bps} bps). Motor/verbal action blocked.`,
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
                rule_id: 'POST_MORTEM_ACTION_BREACH',
                intercepted: false,
                latency_ms: latency,
                diagnostic: 'Action permitted for living entity.',
            }
        } finally {
            this.db.exec('ROLLBACK TO trap3_eval;')
        }
    }

    public runTrap4MuteUtterance(
        attack?: MuteUtteranceAttackPayload,
    ): TrapResult {
        const payload =
            attack ||
            SyntheticHallucinationGenerator.generateMuteUtteranceAttack()
        const t0 = performance.now()

        this.db.exec('SAVEPOINT trap4_eval;')
        try {
            const actor = this.db
                .prepare(
                    `
        SELECT active_conditions FROM entities_physical WHERE id = ?
      `,
                )
                .get(payload.actor_id) as
                { active_conditions: string } | undefined

            const latency = performance.now() - t0

            if (!actor) {
                return {
                    trap_id: 'TRAP_4_MUTE_UTTERANCE',
                    rule_id: 'VOCAL_FEASIBILITY_BREACH',
                    intercepted: true,
                    latency_ms: latency,
                    diagnostic: `VOCAL_FEASIBILITY_BREACH: Actor '${payload.actor_id}' not found.`,
                }
            }

            const conditions = JSON.parse(actor.active_conditions) as string[]
            const isMute =
                conditions.includes('cond_severed_trachea') ||
                conditions.includes('cond_crushed_larynx')

            if (isMute && payload.dialogue_text.trim().length > 0) {
                return {
                    trap_id: 'TRAP_4_MUTE_UTTERANCE',
                    rule_id: 'VOCAL_FEASIBILITY_BREACH',
                    intercepted: true,
                    latency_ms: latency,
                    diagnostic: `VOCAL_FEASIBILITY_BREACH: Actor '${payload.actor_id}' has active vocal trauma (${conditions.join(', ')}). Spoken dialogue lines prohibited.`,
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
                rule_id: 'VOCAL_FEASIBILITY_BREACH',
                intercepted: false,
                latency_ms: latency,
                diagnostic: 'Vocal/non-verbal action permitted.',
            }
        } finally {
            this.db.exec('ROLLBACK TO trap4_eval;')
        }
    }

    public runTrap5MaterialImmunity(
        attack?: MaterialImmunityAttackPayload,
    ): TrapResult {
        const payload =
            attack ||
            SyntheticHallucinationGenerator.generateMaterialImmunityAttack()
        const t0 = performance.now()

        this.db.exec('SAVEPOINT trap5_eval;')
        try {
            const item = this.db
                .prepare(
                    `
        SELECT wetness_bps, combustibility_tier FROM item_placements WHERE item_id = ?
      `,
                )
                .get(payload.item_id) as
                { wetness_bps: number; combustibility_tier: string } | undefined

            const latency = performance.now() - t0

            if (!item) {
                return {
                    trap_id: 'TRAP_5_MATERIAL_IMMUNITY',
                    rule_id: 'COMBUSTION_IMPOSSIBILITY_HALT',
                    intercepted: true,
                    latency_ms: latency,
                    diagnostic: `COMBUSTION_IMPOSSIBILITY_HALT: Item '${payload.item_id}' not registered.`,
                }
            }

            const effectiveCombustibility =
                item.wetness_bps > 3000 ? 'IMMUNE' : item.combustibility_tier

            if (
                payload.attempted_action === 'IGNITE' &&
                effectiveCombustibility === 'IMMUNE'
            ) {
                return {
                    trap_id: 'TRAP_5_MATERIAL_IMMUNITY',
                    rule_id: 'COMBUSTION_IMPOSSIBILITY_HALT',
                    intercepted: true,
                    latency_ms: latency,
                    diagnostic: `COMBUSTION_IMPOSSIBILITY_HALT: Item '${payload.item_id}' wetness is ${item.wetness_bps} bps (>3000 bps). Ignition impossible.`,
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
                rule_id: 'COMBUSTION_IMPOSSIBILITY_HALT',
                intercepted: false,
                latency_ms: latency,
                diagnostic: 'Combustion action permitted.',
            }
        } finally {
            this.db.exec('ROLLBACK TO trap5_eval;')
        }
    }

    public runAllTraps(): HarnessExecutionReport {
        const tStart = performance.now()

        const r1 = this.runTrap1Teleportation()
        const r2 = this.runTrap2GhostGrasp()
        const r3 = this.runTrap3PostMortem()
        const r4 = this.runTrap4MuteUtterance()
        const r5 = this.runTrap5MaterialImmunity()

        const totalLatency = performance.now() - tStart
        const results = [r1, r2, r3, r4, r5]
        const interceptedCount = results.filter((r) => r.intercepted).length
        const allIntercepted = interceptedCount === results.length

        return {
            total_traps: results.length,
            intercepted_count: interceptedCount,
            interception_rate_pct: (interceptedCount / results.length) * 100,
            all_intercepted: allIntercepted,
            total_latency_ms: totalLatency,
            average_latency_ms: totalLatency / results.length,
            sub_10ms_benchmark_passed: totalLatency < 10.0,
            trap_results: results,
        }
    }

    public getDatabase(): Database.Database {
        return this.db
    }

    public close(): void {
        this.db.close()
    }
}

// Standalone CLI runner entrypoint
if (
    process.argv[1] &&
    pathToFileURL(process.argv[1]).href === import.meta.url
) {
    const harness = new SqliteExecutionTrapHarness(':memory:')
    const report = harness.runAllTraps()

    console.log(
        '>> [TRAP_HARNESS] Executing Automated Local SQLite Physical Trap Suite...',
    )
    for (const r of report.trap_results) {
        const statusTag = r.intercepted ? '[INTERCEPTED]' : '[LEAK_BREACH]'
        console.log(
            `>> ${statusTag} ${r.trap_id} (${r.latency_ms.toFixed(2)}ms): ${r.diagnostic}`,
        )
    }

    console.log(
        `>> [TRAP_HARNESS] Summary: ${report.intercepted_count}/${report.total_traps} Intercepted (${report.interception_rate_pct.toFixed(1)}%).`,
    )
    console.log(
        `>> [TRAP_HARNESS] Total Latency: ${report.total_latency_ms.toFixed(2)}ms (Benchmark <10ms: ${report.sub_10ms_benchmark_passed ? 'PASSED' : 'FAILED'}).`,
    )

    harness.close()
    process.exit(
        report.all_intercepted && report.sub_10ms_benchmark_passed ? 0 : 1,
    )
}
