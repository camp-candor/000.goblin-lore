import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { GrievanceMachineRailSchema, GrievanceMachineRail } from "../src/schemas/grievance.js";
import { verifyGrievanceDag } from "../src/health/dagAcyclicity.js";
import { auditFarceRatio } from "../src/health/farceGate.js";
import { LocalRelationalCore } from "../src/db/localRelationalCore.js";

describe("Phase 3: Grievance DAG, Farce Governance & Local Relational Core", () => {
  let core: LocalRelationalCore;

  beforeEach(() => {
    core = new LocalRelationalCore(":memory:");
  });

  afterEach(() => {
    core.close();
  });

  it("enforces primary dyad rules and prevents reflexive disputes (A vs A)", () => {
    const reflexiveGrievance = {
      id: "grv_bog_self_pity",
      name: "Self Pity",
      category: "status_anxiety",
      version: 1,
      participants_primary: ["char_bog", "char_bog"], // Reflexive failure
      intensity: { min_intensity: 1, max_intensity: 3, escalation_rate_bps: 1000, decay_rate_bps: 500 },
      cooldown_cycles: 2,
      spawns_on_max_escalation: [],
      bound_props: [],
      tonal_override_eligible: false,
      created_at_epoch: 0,
      updated_at_epoch: 0,
    };

    expect(() => GrievanceMachineRailSchema.parse(reflexiveGrievance)).toThrow(
      /REFLEXIVE_DISPUTE_PROHIBITED/
    );
  });

  it("detects circular escalation loops in the Grievance DAG via Three-Color DFS", () => {
    const cyclicCorpus: GrievanceMachineRail[] = [
      {
        id: "grv_theft",
        name: "Missing Lentils",
        category: "resource_hoarding",
        version: 1,
        participants_primary: ["char_bog", "char_spleen"],
        intensity: { min_intensity: 1, max_intensity: 3, escalation_rate_bps: 1000, decay_rate_bps: 500 },
        cooldown_cycles: 1,
        spawns_on_max_escalation: ["grv_poison"],
        bound_props: [],
        tonal_override_eligible: false,
        created_at_epoch: 0,
        updated_at_epoch: 0,
      },
      {
        id: "grv_poison",
        name: "Tainted Water",
        category: "secret_keeping",
        version: 1,
        participants_primary: ["char_spleen", "char_bog"],
        intensity: { min_intensity: 2, max_intensity: 4, escalation_rate_bps: 1500, decay_rate_bps: 200 },
        cooldown_cycles: 2,
        spawns_on_max_escalation: ["grv_theft"], // Circular loop back to theft
        bound_props: [],
        tonal_override_eligible: false,
        created_at_epoch: 0,
        updated_at_epoch: 0,
      },
    ];

    const result = verifyGrievanceDag(cyclicCorpus);
    expect(result.isAcyclic).toBe(false);
    expect(result.reason).toContain("CIRCULAR_ESCALATION_DETECTED");
  });

  it("enforces Farce Ratio <= 15% and catches secret clue collisions", () => {
    const grievances: GrievanceMachineRail[] = [
      {
        id: "grv_farce_spoons",
        name: "Spoon Count Debate",
        category: "domestic_sabotage",
        version: 1,
        participants_primary: ["char_bog", "char_wart"],
        intensity: { min_intensity: 1, max_intensity: 2, escalation_rate_bps: 500, decay_rate_bps: 1000 },
        cooldown_cycles: 0,
        spawns_on_max_escalation: [],
        bound_props: ["item_silver_spoon"],
        tonal_override_eligible: true,
        created_at_epoch: 0,
        updated_at_epoch: 0,
      },
      {
        id: "grv_feud",
        name: "Well Feud",
        category: "resource_hoarding",
        version: 1,
        participants_primary: ["char_bog", "char_spleen"],
        intensity: { min_intensity: 2, max_intensity: 4, escalation_rate_bps: 1000, decay_rate_bps: 500 },
        cooldown_cycles: 2,
        spawns_on_max_escalation: [],
        bound_props: [],
        tonal_override_eligible: false,
        created_at_epoch: 0,
        updated_at_epoch: 0,
      },
    ];

    // Case A: 1 of 2 is farce -> 50% > 15% -> fails
    const ratioResult = auditFarceRatio(grievances, []);
    expect(ratioResult.valid).toBe(false);
    expect(ratioResult.reason).toContain("FARCE_RATIO_BREACH");

    // Case B: Prop collision with secret clue fails
    const clueResult = auditFarceRatio([grievances[0]], ["item_silver_spoon"]);
    expect(clueResult.valid).toBe(false);
    expect(clueResult.reason).toContain("FARCE_CLUE_COLLISION");
  });

  it("verifies monotonic dirty cascade and zero-cascade liminal review on local SQLite", () => {
    core.insertFact({
      id: "fact_siphon_location",
      claim_text: "The brass siphon is hidden under Sector 4 culvert",
      scope: "LOGISTIC",
      version: 1,
      author: "Showrunner",
      created_at_ms: 1000,
      last_edited_at_ms: 1000,
    });

    core.registerScene(
      { id: "ep101_sc02", episode_num: 101, scene_num: 2, text: "Searching the culvert." },
      [{ factId: "fact_siphon_location", pinnedVersion: 1 }]
    );

    // Initial state: clean
    let whyDirty = core.queryWhyDirty("fact_siphon_location");
    expect(whyDirty).toHaveLength(0);

    // Liminal Review Test: Setting FLAGGED_FOR_REVIEW must cause ZERO dirty cascades
    core.setFactStanding("fact_siphon_location", "FLAGGED_FOR_REVIEW");
    whyDirty = core.queryWhyDirty("fact_siphon_location");
    expect(whyDirty).toHaveLength(0);

    // Monotonic Update Test: Incrementing version to 2 flags scene dirty
    core.bumpFactVersion("fact_siphon_location", 2);
    whyDirty = core.queryWhyDirty("fact_siphon_location");
    expect(whyDirty).toHaveLength(1);
    expect(whyDirty[0].scene_id).toBe("ep101_sc02");
    expect(whyDirty[0].pinned_version).toBe(1);
    expect(whyDirty[0].current_version).toBe(2);
  });
});
