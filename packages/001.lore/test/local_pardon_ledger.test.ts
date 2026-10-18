import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { LocalPardonLedger } from "../src/db/localPardonLedger.js";
import { PardonRecord } from "../schemas/pardon.schema.js";

describe("Local SQLite Pardon Ledger & Tamper Guard", () => {
  let ledger: LocalPardonLedger;

  beforeEach(() => {
    ledger = new LocalPardonLedger(":memory:");
  });

  afterEach(() => {
    ledger.close();
  });

  it("successfully records and retrieves a valid scoped pardon waiver", () => {
    const validPardon: PardonRecord = {
      id: "pardon_bog_weight_exemption",
      target: {
        series_id: "genesis_core",
        episode_id: "ep101",
        scene_id: "sc02",
        entity_id: "char_bog",
      },
      rule_id: "rule_weight_capacity_ceiling",
      authorizer_id: "auth_ed_showrunner",
      reason: "Bog temporarily carries copper basin out of culvert for dramatic effect.",
      granted_against_entity_hash: "a".repeat(64),
      granted_against_canon_root: "b".repeat(64),
      injected_state_mutation: {
        vector: "logistical",
        payload: {
          capacity_override_grams: 8000,
        },
      },
    };

    ledger.recordPardon(validPardon, 1000);

    const results = ledger.getPardonsForEntity("char_bog");
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe("pardon_bog_weight_exemption");
    expect(results[0].injected_state_mutation?.vector).toBe("logistical");

    const sceneResults = ledger.getPardonsForScene("genesis_core", "ep101", "sc02");
    expect(sceneResults).toHaveLength(1);
    expect(sceneResults[0].target.entity_id).toBe("char_bog");
  });

  it("engine CHECK constraint rejects unpardonable physical and somatic rule waivers", () => {
    const bannedRules = [
      "rule_kinetic_limb_conservation",
      "rule_bimanual_coordination",
      "rule_unresolved_epistemic_leak",
      "SOMATIC_SAT_BREACH",
      "MASS_CONSERVATION_BREACH",
      "VOCAL_FEASIBILITY_BREACH",
      "SPATIAL_CO_PRESENCE_VIOLATION",
    ];

    for (const ruleId of bannedRules) {
      const illegalWaiver: PardonRecord = {
        id: `pardon_illegal_${ruleId.toLowerCase().slice(0, 10)}`,
        target: {
          series_id: "genesis_core",
          episode_id: "ep101",
          scene_id: "sc02",
          entity_id: "char_silas",
        },
        rule_id: ruleId,
        authorizer_id: "auth_ed_showrunner",
        reason: "Attempting to bypass immutable physical invariant through forged waiver.",
        granted_against_entity_hash: "1".repeat(64),
        granted_against_canon_root: "2".repeat(64),
      };

      expect(() => ledger.recordPardon(illegalWaiver)).toThrow();
    }
  });

  it("tamper guard traps entity state drift via NFC SHA-256 comparison", () => {
    const initialEntity = { id: "char_bog", strength: 10, inventory: ["item_knife"] };
    const entityHash = LocalPardonLedger.computeEntityHash(initialEntity);
    const canonRoot = "c".repeat(64);

    const waiver: PardonRecord = {
      id: "pardon_bog_tamper_test",
      target: {
        series_id: "genesis_core",
        episode_id: "ep101",
        scene_id: "sc03",
        entity_id: "char_bog",
      },
      rule_id: "rule_mru_causal_inversion",
      authorizer_id: "auth_ed_showrunner",
      reason: "Dwight Swain reaction before stimulus for jump-scare effect.",
      granted_against_entity_hash: entityHash,
      granted_against_canon_root: canonRoot,
    };

    ledger.recordPardon(waiver);

    // Baseline: Intact
    const checkClean = ledger.verifyPardonTamperIntegrity(
      "pardon_bog_tamper_test",
      initialEntity,
      canonRoot
    );
    expect(checkClean.intact).toBe(true);

    // Drifted Entity: Must detect tamper
    const modifiedEntity = { id: "char_bog", strength: 12, inventory: ["item_knife"] };
    const checkDrift = ledger.verifyPardonTamperIntegrity(
      "pardon_bog_tamper_test",
      modifiedEntity,
      canonRoot
    );
    expect(checkDrift.intact).toBe(false);
    expect(checkDrift.isEntityStale).toBe(true);
    expect(checkDrift.reason).toContain("ENTITY_STATE_TAMPER_DETECTED");

    // Drifted Canon Root: Must detect tamper
    const checkCanonDrift = ledger.verifyPardonTamperIntegrity(
      "pardon_bog_tamper_test",
      initialEntity,
      "d".repeat(64)
    );
    expect(checkCanonDrift.intact).toBe(false);
    expect(checkCanonDrift.isCanonRootStale).toBe(true);
    expect(checkCanonDrift.reason).toContain("CANON_ROOT_TAMPER_DETECTED");
  });

  it("correctly counts active waivers per rule for frequency limit auditing", () => {
    expect(ledger.countWaiversByRule("rule_weight_capacity_ceiling")).toBe(0);

    for (let i = 1; i <= 3; i++) {
      ledger.recordPardon({
        id: `pardon_frequency_${i}`,
        target: {
          series_id: "genesis_core",
          episode_id: "ep101",
          scene_id: `sc0${i}`,
          entity_id: `char_goblin_${i}`,
        },
        rule_id: "rule_weight_capacity_ceiling",
        authorizer_id: "auth_ed_showrunner",
        reason: `Load allowance override for goblin carrier number ${i}.`,
        granted_against_entity_hash: "0".repeat(64),
        granted_against_canon_root: "0".repeat(64),
      });
    }

    expect(ledger.countWaiversByRule("rule_weight_capacity_ceiling")).toBe(3);
  });
});
