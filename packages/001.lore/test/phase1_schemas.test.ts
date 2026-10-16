import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";
import {
  CharacterMachineRailSchema,
  PossessionMachineRailSchema,
  CharacterMachineRail,
  PossessionMachineRail,
} from "../src/schemas/entities";
import {
  verifyByteZeroIntegrity,
  scaffoldCharacterDossier,
} from "../src/scaffolder/entityBuilder";
import { evaluateSomaticSAT } from "../src/scaffolder/satSolver";
import { LocalSqliteLedger } from "../src/db/localSqlite";

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

  it("enforces strict Zod validation rejecting un-schemaed keys", () => {
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

  it("detects and rejects UTF-8 BOM and carriage return corruption", () => {
    const bomBuffer = Buffer.from([0xef, 0xbb, 0xbf, 0x2d, 0x2d, 0x2d, 0x0a]);
    const bomResult = verifyByteZeroIntegrity(bomBuffer);
    expect(bomResult.valid).toBe(false);
    expect(bomResult.hasBom).toBe(true);

    const crBuffer = Buffer.from("---\r\nid: char_wart\r\n---\n", "utf8");
    const crResult = verifyByteZeroIntegrity(crBuffer);
    expect(crResult.valid).toBe(false);
    expect(crResult.hasCarriageReturns).toBe(true);
  });

  it("verifies the Somatic Hand Capacity Invariant at T0 = $0.00", () => {
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

    const satResult = evaluateSomaticSAT(injuredCharacter, [twoHandedSiphon]);
    expect(satResult.satisfiable).toBe(false);
    expect(satResult.errorCode).toBe("SOMATIC_SAT_BREACH");
    expect(satResult.netArmsAvailable).toBe(1);
    expect(satResult.handsDemanded).toBe(2);

    const motorResult = evaluateSomaticSAT(injuredCharacter, [], ["sprint"]);
    expect(motorResult.satisfiable).toBe(false);
    expect(motorResult.errorCode).toBe("KINETIC_VERB_BREACH");
  });

  it("demonstrates deterministic cache invalidation on local SQLite ledger", () => {
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

    // Bump fact version to simulate upstream retcon
    ledger.bumpFactVersion("fact_arm_injury", 2);

    scene = ledger.getScene("ep101_sc01");
    expect(scene?.status).toBe("dirty");
    expect(scene?.is_dirty).toBe(1);
  });
});
