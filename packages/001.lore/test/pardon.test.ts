import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  RuleSchema,
  AuthorizerSchema,

  InjectedStateMutationSchema,
} from "../schemas/pardon.schema.js";
import {
  validatePass2Pardons,
  computeEntityNfcHash,
} from "../src/core/governance/pardonEnforcer.js";
import { LocalPardonLedger } from "../src/db/localPardonLedger.js";

describe("Phase 4: Non-Pardonable Invariant Classification Schema & Pardon Ledger", () => {
  let ledger: LocalPardonLedger;

  beforeEach(() => {
    ledger = new LocalPardonLedger(":memory:");
  });

  afterEach(() => {
    ledger.close();
  });

  it("structurally rejects PHYSICAL_SOMATIC rules declaring pardonable: true via .refine()", () => {
    const illegalPhysicalRule = {
      id: "rule_kinetic_limb_conservation",
      description: "Characters cannot use missing or crushed limbs.",
      pardonable: true, // ILLEGAL: Hard somatic rules must be pardonable: false
      severity_class: "PHYSICAL_SOMATIC",
      owning_entity_types: ["character"],
      max_tolerated_pardon_frequency: 1,
    };

    expect(() => RuleSchema.parse(illegalPhysicalRule)).toThrow(/STRUCTURAL_BREACH/);
  });

  it("structurally rejects EPISTEMIC rules declaring pardonable: true via .refine()", () => {
    const illegalEpistemicRule = {
      id: "rule_unresolved_epistemic_leak",
      description: "Characters in ignorance cannot speak mystery secrets.",
      pardonable: true, // ILLEGAL: Epistemic secrets must be pardonable: false
      severity_class: "EPISTEMIC",
      owning_entity_types: ["character"],
      max_tolerated_pardon_frequency: 1,
    };

    expect(() => RuleSchema.parse(illegalEpistemicRule)).toThrow(/STRUCTURAL_BREACH/);
  });

  it("enforces discriminated union validation on InjectedStateMutationSchema (no z.unknown)", () => {
    const validLogisticalMutation = {
      vector: "logistical" as const,
      payload: {
        capacity_override_grams: 8000,
        slot_borrow: { source_slot: "held" as const, target_slot: "carried" as const },
      },
    };
    expect(() => InjectedStateMutationSchema.parse(validLogisticalMutation)).not.toThrow();

    const rogueMutation = {
      vector: "somatic" as const,
      payload: {
        untyped_hallucinated_field: "DANGEROUS_MUTATION", // Must be rejected
      },
    };
    expect(() => InjectedStateMutationSchema.parse(rogueMutation)).toThrow();
  });

  it("fails raw SQL insertion in local SQLite when attempting to record unpardonable rule waivers", () => {
    const unpardonableWaiver = {
      id: "pardon_silas_severed_arm",
      target: {
        series_id: "genesis_core",
        episode_id: "ep101",
        scene_id: "sc02",
        entity_id: "char_silas",
      },
      rule_id: "rule_kinetic_limb_conservation", // BANNED by SQLite CHECK constraint
      authorizer_id: "auth_ed_showrunner",
      reason: "Dramatic necessity to pull emergency lever with crushed arm",
      granted_against_entity_hash: "a".repeat(64),
      granted_against_canon_root: "b".repeat(64),
    };

    expect(() => ledger.recordPardon(unpardonableWaiver)).toThrow(/CHECK constraint failed/);
  });

  it("Pass 2 halts with FATAL error when a pardon targets an unpardonable rule", () => {
    const rules = new Map([
      [
        "rule_kinetic_limb_conservation",
        RuleSchema.parse({
          id: "rule_kinetic_limb_conservation",
          description: "Cannot use severed arm.",
          pardonable: false,
          severity_class: "PHYSICAL_SOMATIC",
          owning_entity_types: ["character"],
        }),
      ],
    ]);

    const authorizers = new Map([
      [
        "auth_ed_showrunner",
        AuthorizerSchema.parse({
          id: "auth_ed_showrunner",
          name: "Ed Showrunner",
          role: "SHOWRUNNER",
          permitted_severity_classes: ["PHYSICAL_SOMATIC", "ONTOLOGY"],
        }),
      ],
    ]);

    const entities = {
      characters: { char_silas: { id: "char_silas", name: "Silas" } },
      locations: {},
      possessions: {},
      grievances: {},
    };

    const pardons = {
      pardon_01: {
        id: "pardon_01",
        target: { series_id: "gen", episode_id: "ep1", scene_id: "sc1", entity_id: "char_silas" },
        rule_id: "rule_kinetic_limb_conservation",
        authorizer_id: "auth_ed_showrunner",
        reason: "Silas must use his paralyzed arm to save the village.",
        granted_against_entity_hash: computeEntityNfcHash(entities.characters.char_silas),
        granted_against_canon_root: "0".repeat(64),
      },
    };

    expect(() => validatePass2Pardons(pardons, rules, authorizers, entities)).toThrow(
      /\[PASS 2 PARDON FATAL\]/
    );
  });

  it("Pass 2 rejects waivers signed by unauthorized signers lacking severity permission", () => {
    const rules = new Map([
      [
        "rule_weight_capacity_ceiling",
        RuleSchema.parse({
          id: "rule_weight_capacity_ceiling",
          description: "Capacity limit on mass carried.",
          pardonable: true,
          severity_class: "ONTOLOGY",
          owning_entity_types: ["character"],
        }),
      ],
    ]);

    const authorizers = new Map([
      [
        "auth_scene_director",
        AuthorizerSchema.parse({
          id: "auth_scene_director",
          name: "Guest Director",
          role: "SCENE_DIRECTOR",
          permitted_severity_classes: ["FORMAT", "STYLE"], // Does NOT include ONTOLOGY
        }),
      ],
    ]);

    const entities = {
      characters: { char_bog: { id: "char_bog", name: "Bog" } },
      locations: {},
      possessions: {},
      grievances: {},
    };

    const pardons = {
      pardon_02: {
        id: "pardon_02",
        target: { series_id: "gen", episode_id: "ep1", scene_id: "sc2", entity_id: "char_bog" },
        rule_id: "rule_weight_capacity_ceiling",
        authorizer_id: "auth_scene_director",
        reason: "Bog hoists heavy iron cauldron alone in scene 2.",
        granted_against_entity_hash: computeEntityNfcHash(entities.characters.char_bog),
        granted_against_canon_root: "0".repeat(64),
      },
    };

    expect(() => validatePass2Pardons(pardons, rules, authorizers, entities)).toThrow(
      /\[PASS 2 PARDON PERMISSION DENIED\]/
    );
  });

  it("detects entity-scoped hash divergence without false-positive stalls on unrelated edits", () => {
    const rules = new Map([
      [
        "rule_weight_capacity_ceiling",
        RuleSchema.parse({
          id: "rule_weight_capacity_ceiling",
          description: "Capacity limit on mass carried.",
          pardonable: true,
          severity_class: "ONTOLOGY",
          owning_entity_types: ["character"],
        }),
      ],
    ]);

    const authorizers = new Map([
      [
        "auth_ed_showrunner",
        AuthorizerSchema.parse({
          id: "auth_ed_showrunner",
          name: "Ed Showrunner",
          role: "SHOWRUNNER",
          permitted_severity_classes: ["ONTOLOGY"],
        }),
      ],
    ]);

    const charBog = { id: "char_bog", name: "Bog", carry_limit: 4000 };
    const oldHash = computeEntityNfcHash(charBog);

    const entities = {
      characters: {
        char_bog: { ...charBog, carry_limit: 3000 }, // Bog mutated!
        char_wart: { id: "char_wart", name: "Wart" },
      },
      locations: {},
      possessions: {},
      grievances: {},
    };

    const pardons = {
      pardon_03: {
        id: "pardon_03",
        target: { series_id: "gen", episode_id: "ep1", scene_id: "sc3", entity_id: "char_bog" },
        rule_id: "rule_weight_capacity_ceiling",
        authorizer_id: "auth_ed_showrunner",
        reason: "Bog carries excess copper pipes for narrative effect.",
        granted_against_entity_hash: oldHash, // Stale hash
        granted_against_canon_root: "0".repeat(64),
      },
    };

    const result = validatePass2Pardons(pardons, rules, authorizers, entities);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0].code).toBe("STALE_ENTITY_PARDON");
  });
});
