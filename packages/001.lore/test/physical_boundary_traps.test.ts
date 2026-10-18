import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  PhysicalAdversarialRunner,

} from "../src/testkit/physicalAdversarialRunner.js";
import { SyntheticHallucinationGenerator } from "../src/testkit/syntheticHallucinationGenerator.js";

describe("Task GPS-5.1: Five-Vector Physical State Adversarial Injection Test Battery", () => {
  let runner: PhysicalAdversarialRunner;

  beforeEach(() => {
    runner = new PhysicalAdversarialRunner(":memory:");
    runner.seedBaselinePhysicalReality();
  });

  afterEach(() => {
    runner.close();
  });

  it("TRAP 1: Intercepts Teleportation Attack (Spatial Discontinuity)", () => {
    const attack = SyntheticHallucinationGenerator.generateTeleportationAttack();
    const result = runner.evaluateTeleportation(attack);

    expect(result.intercepted).toBe(true);
    expect(result.error_vector?.rule_id).toBe("SPATIAL_DISJOINTNESS_BREACH");
    expect(result.error_vector?.target_entity).toBe("char_wart");
    expect(result.error_vector?.offending_tokens).toContain("loc_culvert");
    expect(result.error_vector?.offending_tokens).toContain("loc_attic");
    expect(result.latency_ms).toBeLessThan(10.0);
  });

  it("TRAP 1 (Positive Control): Permits legal traversal through adjacent portal", () => {
    const legalMove = {
      actor_id: "char_wart",
      source_room_id: "loc_culvert",
      target_room_id: "loc_pump_house", // Legal adjacent portal
      attempted_action: "MOVE_TO_ROOM" as const,
    };
    const result = runner.evaluateTeleportation(legalMove);
    expect(result.intercepted).toBe(false);
  });

  it("TRAP 2: Intercepts Ghost Grasp Attack (Conservation of Matter / Stolen Slot)", () => {
    const attack = SyntheticHallucinationGenerator.generateGhostGraspAttack();
    const result = runner.evaluateGhostGrasp(attack);

    expect(result.intercepted).toBe(true);
    expect(result.error_vector?.rule_id).toBe("MASS_CONSERVATION_BREACH");
    expect(result.error_vector?.target_entity).toBe("char_wart");
    expect(result.error_vector?.offending_tokens).toContain("item_brass_siphon");
    expect(result.error_vector?.offending_tokens).toContain("char_bog");
    expect(result.latency_ms).toBeLessThan(10.0);
  });

  it("TRAP 2 (Positive Control): Permits equipping an unheld, cached room item", () => {
    // Bog drops siphon in room
    const result = runner.evaluateGhostGrasp({
      actor_id: "char_bog",
      target_item_id: "item_brass_siphon",
      victim_actor_id: "char_bog",
      attempted_action: "EQUIP_ITEM",
    });
    expect(result.intercepted).toBe(false);
  });

  it("TRAP 3: Intercepts Post-Mortem Action Attack (Deceased Actor Action)", () => {
    const attack = SyntheticHallucinationGenerator.generatePostMortemAttack();
    const result = runner.evaluatePostMortem(attack);

    expect(result.intercepted).toBe(true);
    expect(result.error_vector?.rule_id).toBe("POST_MORTEM_ACTION_BREACH");
    expect(result.error_vector?.target_entity).toBe("char_mum_grissel");
    expect(result.error_vector?.offending_tokens).toContain("DECEASED");
    expect(result.latency_ms).toBeLessThan(10.0);
  });

  it("TRAP 3 (Positive Control): Permits living character with full vitality to speak", () => {
    const livingAction = {
      actor_id: "char_bog",
      vitality_bps: 10000,
      consciousness_status: "AWAKE" as const,
      attempted_action: "SPEAK" as const,
      dialogue_text: "Let's check the pump house.",
    };
    const result = runner.evaluatePostMortem(livingAction as any);
    expect(result.intercepted).toBe(false);
  });

  it("TRAP 4: Intercepts Mute Utterance Attack (Severed Trachea Spoken Dialogue)", () => {
    const attack = SyntheticHallucinationGenerator.generateMuteUtteranceAttack();
    const result = runner.evaluateMuteUtterance(attack);

    expect(result.intercepted).toBe(true);
    expect(result.error_vector?.rule_id).toBe("VOCAL_FEASIBILITY_BREACH");
    expect(result.error_vector?.target_entity).toBe("char_silas");
    expect(result.error_vector?.offending_tokens).toContain("cond_severed_trachea");
    expect(result.latency_ms).toBeLessThan(10.0);
  });

  it("TRAP 4 (Positive Control): Permits non-verbal acoustic gasp with empty dialogue text", () => {
    const nonVerbalAction = {
      actor_id: "char_silas",
      active_condition: "cond_severed_trachea" as const,
      dialogue_text: "", // Non-verbal: dialogue text is empty
      observable_parenthetical: "Emits a dry, wheezing gasp through teeth",
    };
    const result = runner.evaluateMuteUtterance(nonVerbalAction);
    expect(result.intercepted).toBe(false);
  });

  it("TRAP 5: Intercepts Material Immunity Attack (Underwater / Wet Match Ignition)", () => {
    const attack = SyntheticHallucinationGenerator.generateMaterialImmunityAttack();
    const result = runner.evaluateMaterialImmunity(attack);

    expect(result.intercepted).toBe(true);
    expect(result.error_vector?.rule_id).toBe("COMBUSTION_IMPOSSIBILITY_HALT");
    expect(result.error_vector?.target_entity).toBe("item_matches");
    expect(result.error_vector?.offending_tokens).toContain("wetness_8500_bps");
    expect(result.latency_ms).toBeLessThan(10.0);
  });

  it("TRAP 5 (Positive Control): Permits ignition of dry match (wetness <= 3000 bps)", () => {
    const dryMatchAction = {
      actor_id: "char_bog",
      item_id: "item_dry_torch",
      environment_room_id: "loc_culvert",
      item_wetness_bps: 500, // Dry
      attempted_action: "IGNITE" as const,
    };
    // Temporarily insert dry match
    (runner as any).db
      .prepare("INSERT INTO item_placements VALUES ('item_dry_torch', 'Dry Torch', 'ROOM', 'loc_culvert', NULL, 500, 'IGNITABLE')")
      .run();

    const result = runner.evaluateMaterialImmunity(dryMatchAction);
    expect(result.intercepted).toBe(false);
  });

  it("BENCHMARK: Evaluates all 5 adversarial traps in < 10ms total execution time", () => {
    const t0 = performance.now();

    const r1 = runner.evaluateTeleportation(SyntheticHallucinationGenerator.generateTeleportationAttack());
    const r2 = runner.evaluateGhostGrasp(SyntheticHallucinationGenerator.generateGhostGraspAttack());
    const r3 = runner.evaluatePostMortem(SyntheticHallucinationGenerator.generatePostMortemAttack());
    const r4 = runner.evaluateMuteUtterance(SyntheticHallucinationGenerator.generateMuteUtteranceAttack());
    const r5 = runner.evaluateMaterialImmunity(SyntheticHallucinationGenerator.generateMaterialImmunityAttack());

    const totalElapsedMs = performance.now() - t0;

    expect(r1.intercepted).toBe(true);
    expect(r2.intercepted).toBe(true);
    expect(r3.intercepted).toBe(true);
    expect(r4.intercepted).toBe(true);
    expect(r5.intercepted).toBe(true);
    expect(totalElapsedMs).toBeLessThan(10.0);
  });
});
