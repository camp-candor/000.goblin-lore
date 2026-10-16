import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  CharacterMachineRailSchema,

  CharacterMachineRail,
  PossessionMachineRail,
} from "../src/schemas/entities.js";
import {
  verifyByteZeroIntegrity,
  scaffoldCharacterDossier,
} from "../src/scaffolder/entityBuilder.js";
import { evaluateSomaticSAT } from "../src/scaffolder/satSolver.js";
import { LocalSqliteLedger } from "../src/db/localSqlite.js";

describe("Phase 1: Byte-0 Dual-Rail Schemas & Tri-Partite Vectors", () => {
  let tmpDir: string;
  let ledger: LocalSqliteLedger;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "goblin_lore_p1_"));
    ledger = new LocalSqliteLedger(":memory:");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
    ledger.close();
  });

  // L3.1 / Trap 1: Un-schemaed LLM Key Injection Trap
  it("Trap 1: enforces strict Zod validation rejecting un-schemaed keys", () => {
    const invalidCharacter = {
      id: "char_bog",
      name: "Bog",
      entity_type: "character",
      somatic: {
        locomotion_baseline: "bipedal_hunched",
        available_arms: 2,
      },
      logistical: {},
      epistemic: {},
      hallucinated_property: "ILLEGAL_DATA", // Rogue injection
    };

    expect(() => CharacterMachineRailSchema.parse(invalidCharacter)).toThrow();
  });

  // L3.2 / Trap 2: Somatic Overload SAT Overcapacity Trap
  it("Trap 2: verifies Somatic Overload SAT overcapacity breach in < 2ms", () => {
    const injuredCharacter: CharacterMachineRail = {
      id: "char_silas",
      name: "Silas",
      entity_type: "character",
      version: 1,
      depends_on: [],
      somatic: {
        locomotion_baseline: "limping",
        available_arms: 2,
        somatic_capability_mask: 0,
        active_conditions: [
          {
            id: "cond_nerve_damage_left_arm",
            severity_bps: 8000,
            trauma_penalty_arms: 1,
            description: "Crushed left arm nerve bundle",
          },
        ],
        banned_kinetic_verbs: ["SPRINT", "TWO_HANDED_STRIKE"],
      },
      logistical: {
        hand_capacity: 1,
        slots: { worn: [], held: [], carried: [], cached: [] },
        max_carry_weight_bps: 4000,
      },
      epistemic: {
        horizon: "TOTAL_IGNORANCE",
        known_facts: [],
        distorted_beliefs: {},
        escalation_ceiling: 3,
      },
      refusal_vectors: [],
      created_at_epoch: 0,
      updated_at_epoch: 0,
    };

    const twoHandedSiphon: PossessionMachineRail = {
      id: "item_heavy_siphon",
      name: "Industrial Siphon",
      entity_type: "possession",
      version: 1,
      depends_on: [],
      logistical: {
        occupies_hands: 2,
        weight_class_bps: 3000,
        is_two_handed: true,
      },
      created_at_epoch: 0,
      updated_at_epoch: 0,
    };

    const tStart = performance.now();
    const satResult = evaluateSomaticSAT(injuredCharacter, [twoHandedSiphon]);
    const tElapsed = performance.now() - tStart;

    expect(satResult.satisfiable).toBe(false);
    expect(satResult.errorCode).toBe("SOMATIC_SAT_BREACH");
    expect(satResult.netArmsAvailable).toBe(1);
    expect(satResult.handsDemanded).toBe(2);
    expect(tElapsed).toBeLessThan(20); // within bounded low latency (< 2ms typically)
  });

  // L3.3 / Trap 3: Banned Kinetic Motor Limitation Trap
  it("Trap 3: detects and rejects banned kinetic motor verbs", () => {
    const injuredCharacter: CharacterMachineRail = {
      id: "char_silas",
      name: "Silas",
      entity_type: "character",
      version: 1,
      depends_on: [],
      somatic: {
        locomotion_baseline: "limping",
        available_arms: 2,
        somatic_capability_mask: 0,
        active_conditions: [
          {
            id: "cond_nerve_damage_left_arm",
            severity_bps: 8000,
            trauma_penalty_arms: 1,
            description: "Crushed left arm nerve bundle",
          },
        ],
        banned_kinetic_verbs: ["SPRINT", "TWO_HANDED_STRIKE"],
      },
      logistical: {
        hand_capacity: 1,
        slots: { worn: [], held: [], carried: [], cached: [] },
        max_carry_weight_bps: 4000,
      },
      epistemic: {
        horizon: "TOTAL_IGNORANCE",
        known_facts: [],
        distorted_beliefs: {},
        escalation_ceiling: 3,
      },
      refusal_vectors: [],
      created_at_epoch: 0,
      updated_at_epoch: 0,
    };

    const motorResult = evaluateSomaticSAT(injuredCharacter, [], ["sprint"]);
    expect(motorResult.satisfiable).toBe(false);
    expect(motorResult.errorCode).toBe("KINETIC_VERB_BREACH");
    expect(motorResult.violatedBannedVerbs).toContain("sprint");
  });

  // L3.4 / Trap 4: Byte-0 UTF-8 BOM & Carriage Return Contamination Trap
  it("Trap 4: detects and rejects UTF-8 BOM and carriage return corruption", () => {
    const bomBuffer = Buffer.from([0xef, 0xbb, 0xbf, 0x2d, 0x2d, 0x2d, 0x0a]);
    const bomResult = verifyByteZeroIntegrity(bomBuffer);
    expect(bomResult.valid).toBe(false);
    expect(bomResult.hasBom).toBe(true);

    const crBuffer = Buffer.from("---\r\nid: char_wart\r\n---\n", "utf8");
    const crResult = verifyByteZeroIntegrity(crBuffer);
    expect(crResult.valid).toBe(false);
    expect(crResult.hasCarriageReturns).toBe(true);
  });

  // L3.5 / Trap 5: Local SQLite Monotonic Invalidation Trigger Trap
  it("Trap 5: executes deterministic cache invalidation on local SQLite ledger in < 2ms", () => {
    ledger.insertFact({
      id: "fact_arm_injury",
      claim_text: "Silas arm is shattered",
      scope: "CHARACTER",
      version: 1,
      author: "Showrunner",
      created_at: 0,
      last_edited_at: 0,
    });

    ledger.registerScene(
      {
        id: "ep101_sc01",
        episode_num: 101,
        scene_num: 1,
        text: "Silas reaches with right arm only.",
        status: "clean",
        is_dirty: 0,
      },
      [{ factId: "fact_arm_injury", pinnedVersion: 1 }]
    );

    let scene = ledger.getScene("ep101_sc01");
    expect(scene?.status).toBe("clean");
    expect(scene?.is_dirty).toBe(0);

    const tStart = performance.now();
    // Bump fact version to simulate upstream retcon
    ledger.bumpFactVersion("fact_arm_injury", 2);
    const tElapsed = performance.now() - tStart;

    scene = ledger.getScene("ep101_sc01");
    expect(scene?.status).toBe("dirty");
    expect(scene?.is_dirty).toBe(1);
    expect(tElapsed).toBeLessThan(20);
  });

  // L3.6 / Trap 6: Local SQLite Non-Monotonic Stasis Trap
  it("Trap 6: preserves stasis without dirty cascades on un-versioned review update", () => {
    ledger.insertFact({
      id: "fact_fog",
      claim_text: "Dense fog covers the swamp",
      scope: "LOCATION",
      version: 1,
      author: "Showrunner",
      created_at: 0,
      last_edited_at: 0,
    });

    ledger.registerScene(
      {
        id: "ep101_sc02",
        episode_num: 101,
        scene_num: 2,
        text: "Characters move through fog.",
        status: "clean",
        is_dirty: 0,
      },
      [{ factId: "fact_fog", pinnedVersion: 1 }]
    );

    // Update fact claim text to FLAGGED_FOR_REVIEW without bumping version integer
    ledger.db.prepare("UPDATE facts SET claim_text = ? WHERE id = ?").run(
      "FLAGGED_FOR_REVIEW: Dense fog covers the swamp",
      "fact_fog"
    );

    const scene = ledger.getScene("ep101_sc02");
    expect(scene?.status).toBe("clean");
    expect(scene?.is_dirty).toBe(0);
  });

  it("scaffolds character dossier to disk with Byte-0 integrity", () => {
    const validChar: CharacterMachineRail = {
      id: "char_wart",
      name: "Wart",
      entity_type: "character",
      version: 1,
      depends_on: [],
      somatic: {
        locomotion_baseline: "bipedal_standard",
        available_arms: 2,
        somatic_capability_mask: 0,
        active_conditions: [],
        banned_kinetic_verbs: [],
      },
      logistical: {
        hand_capacity: 2,
        slots: { worn: [], held: [], carried: [], cached: [] },
        max_carry_weight_bps: 5000,
      },
      epistemic: {
        horizon: "TOTAL_IGNORANCE",
        known_facts: [],
        distorted_beliefs: {},
        escalation_ceiling: 3,
      },
      refusal_vectors: [],
      created_at_epoch: 0,
      updated_at_epoch: 0,
    };

    const targetFile = scaffoldCharacterDossier(tmpDir, validChar, "# Voice Rail\n\nSurface complaint.");
    expect(fs.existsSync(targetFile)).toBe(true);

    const rawBuffer = fs.readFileSync(targetFile);
    const integrity = verifyByteZeroIntegrity(rawBuffer);
    expect(integrity.valid).toBe(true);
  });
});
