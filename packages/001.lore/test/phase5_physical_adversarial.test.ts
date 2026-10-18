import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { SqliteExecutionTrapHarness } from '../src/testkit/sqliteExecutionTrapHarness.js'
import { SyntheticHallucinationGenerator } from '../src/testkit/syntheticHallucinationGenerator.js'

describe('Task GPS-5.2: Automated Local SQLite Execution Trap Harness', () => {
    let harness: SqliteExecutionTrapHarness

    beforeEach(() => {
        harness = new SqliteExecutionTrapHarness(':memory:')
    })

    afterEach(() => {
        harness.close()
    })

    it('executes the full adversarial gauntlet with 100% interception and <10ms latency', () => {
        const report = harness.runAllTraps()

        expect(report.total_traps).toBe(5)
        expect(report.intercepted_count).toBe(5)
        expect(report.interception_rate_pct).toBe(100.0)
        expect(report.all_intercepted).toBe(true)
        expect(report.total_latency_ms).toBeLessThan(10.0)
        expect(report.sub_10ms_benchmark_passed).toBe(true)

        for (const r of report.trap_results) {
            expect(r.intercepted).toBe(true)
            expect(r.error_vector).toBeDefined()
            expect(r.error_vector?.domain).toBe('PHYSICAL_STATE')
            expect(r.error_vector?.offending_tokens.length).toBeGreaterThan(0)
        }
    })

    it('verifies atomic transaction rollback preserves baseline state after attack evaluation', () => {
        const db = harness.getDatabase()

        // Query baseline counts
        const preEntities = db
            .prepare('SELECT COUNT(*) AS c FROM entities_physical')
            .get() as { c: number }
        const preItems = db
            .prepare('SELECT COUNT(*) AS c FROM item_placements')
            .get() as { c: number }

        // Execute all traps
        harness.runAllTraps()

        // Query post counts
        const postEntities = db
            .prepare('SELECT COUNT(*) AS c FROM entities_physical')
            .get() as { c: number }
        const postItems = db
            .prepare('SELECT COUNT(*) AS c FROM item_placements')
            .get() as { c: number }

        expect(postEntities.c).toBe(preEntities.c)
        expect(postItems.c).toBe(preItems.c)

        // Verify Bog still holds the siphon
        const bogItem = db
            .prepare(
                `
      SELECT carrier_id, slot_name FROM item_placements WHERE item_id = 'item_brass_siphon'
    `,
            )
            .get() as { carrier_id: string; slot_name: string }

        expect(bogItem.carrier_id).toBe('char_bog')
        expect(bogItem.slot_name).toBe('held')
    })

    it('TRAP 1: Intercepts disconnected room transit and passes legal adjacent transit', () => {
        // Attack: Culvert -> Attic (disconnected)
        const attack =
            SyntheticHallucinationGenerator.generateTeleportationAttack()
        const attackRes = harness.runTrap1Teleportation(attack)
        expect(attackRes.intercepted).toBe(true)
        expect(attackRes.rule_id).toBe('SPATIAL_DISJOINTNESS_BREACH')

        // Positive Control: Culvert -> Pump House (connected portal)
        const legalMove = {
            actor_id: 'char_wart',
            source_room_id: 'loc_culvert',
            target_room_id: 'loc_pump_house',
            attempted_action: 'MOVE_TO_ROOM' as const,
        }
        const legalRes = harness.runTrap1Teleportation(legalMove)
        expect(legalRes.intercepted).toBe(false)
    })

    it('TRAP 2: Intercepts ghost grasp and permits legal acquisition of room item', () => {
        // Attack: Wart takes Bog's held siphon
        const attack =
            SyntheticHallucinationGenerator.generateGhostGraspAttack()
        const attackRes = harness.runTrap2GhostGrasp(attack)
        expect(attackRes.intercepted).toBe(true)
        expect(attackRes.rule_id).toBe('MASS_CONSERVATION_BREACH')

        // Positive Control: Bog picks up unheld item in room
        const db = harness.getDatabase()
        db.prepare(
            `
      INSERT INTO item_placements VALUES ('item_iron_rod', 'Iron Rod', 'ROOM', 'loc_culvert', 'FLOOR', 0, 'IMMUNE')
    `,
        ).run()

        const legalPick = {
            actor_id: 'char_bog',
            target_item_id: 'item_iron_rod',
            victim_actor_id: 'char_bog',
            attempted_action: 'EQUIP_ITEM' as const,
        }
        const legalRes = harness.runTrap2GhostGrasp(legalPick)
        expect(legalRes.intercepted).toBe(false)
    })

    it('TRAP 3: Intercepts deceased actions and permits living actions', () => {
        // Attack: Mum Grissel (vitality = 0, DECEASED) speaks
        const attack =
            SyntheticHallucinationGenerator.generatePostMortemAttack()
        const attackRes = harness.runTrap3PostMortem(attack)
        expect(attackRes.intercepted).toBe(true)
        expect(attackRes.rule_id).toBe('POST_MORTEM_ACTION_BREACH')

        // Positive Control: Silas (vitality = 6000, AWAKE) acts
        const livingAction = {
            actor_id: 'char_silas',
            vitality_bps: 6000,
            consciousness_status: 'AWAKE' as const,
            attempted_action: 'STRIKE' as const,
        }
        const livingRes = harness.runTrap3PostMortem(livingAction as any)
        expect(livingRes.intercepted).toBe(false)
    })

    it('TRAP 4: Intercepts mute dialogue and permits non-verbal gasps', () => {
        // Attack: Silas speaks dialogue with severed trachea
        const attack =
            SyntheticHallucinationGenerator.generateMuteUtteranceAttack()
        const attackRes = harness.runTrap4MuteUtterance(attack)
        expect(attackRes.intercepted).toBe(true)
        expect(attackRes.rule_id).toBe('VOCAL_FEASIBILITY_BREACH')

        // Positive Control: Silas gasps non-verbally (empty dialogue text)
        const nonVerbalAction = {
            actor_id: 'char_silas',
            active_condition: 'cond_severed_trachea' as const,
            dialogue_text: '',
            observable_parenthetical:
                'Wheezes painfully through clenched teeth',
        }
        const nonVerbalRes = harness.runTrap4MuteUtterance(nonVerbalAction)
        expect(nonVerbalRes.intercepted).toBe(false)
    })

    it('TRAP 5: Intercepts submerged match ignition and permits dry match ignition', () => {
        // Attack: Igniting matches with wetness = 8500 bps
        const attack =
            SyntheticHallucinationGenerator.generateMaterialImmunityAttack()
        const attackRes = harness.runTrap5MaterialImmunity(attack)
        expect(attackRes.intercepted).toBe(true)
        expect(attackRes.rule_id).toBe('COMBUSTION_IMPOSSIBILITY_HALT')

        // Positive Control: Igniting dry matches (wetness = 500 bps)
        const db = harness.getDatabase()
        db.prepare(
            `
      INSERT INTO item_placements VALUES ('item_dry_match', 'Dry Match', 'ACTOR_SLOT', 'char_bog', 'held', 500, 'IGNITABLE')
    `,
        ).run()

        const dryIgnition = {
            actor_id: 'char_bog',
            item_id: 'item_dry_match',
            environment_room_id: 'loc_culvert',
            item_wetness_bps: 500,
            attempted_action: 'IGNITE' as const,
        }
        const dryRes = harness.runTrap5MaterialImmunity(dryIgnition)
        expect(dryRes.intercepted).toBe(false)
    })
})
