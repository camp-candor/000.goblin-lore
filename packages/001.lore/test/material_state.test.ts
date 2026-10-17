import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import {
  MaterialStateVectorSchema,
  MaterialStateVector,
  AttemptedOperation,
} from "../src/schemas/materialState.js";
import { MaterialFeasibilitySolver } from "../src/scaffolder/materialSolver.js";

describe("Ground-Truth Physical State: Material State Vector & Structural Integrity", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE material_states (
        item_id TEXT PRIMARY KEY,
        material_class TEXT NOT NULL,
        wetness_bps INTEGER NOT NULL CHECK(wetness_bps BETWEEN 0 AND 10000),
        corrosion_bps INTEGER NOT NULL CHECK(corrosion_bps BETWEEN 0 AND 10000),
        structural_integrity_bps INTEGER NOT NULL CHECK(structural_integrity_bps BETWEEN 0 AND 10000),
        damage_threshold_bps INTEGER NOT NULL CHECK(damage_threshold_bps BETWEEN 0 AND 10000),
        combustibility_tier TEXT NOT NULL CHECK(combustibility_tier IN ('IMMUNE', 'IGNITABLE', 'HIGHLY_VOLATILE')),
        is_operable INTEGER NOT NULL CHECK(is_operable IN (0, 1)),
        updated_at_epoch INTEGER NOT NULL DEFAULT 0
      );
    `);
  });

  afterEach(() => {
    db.close();
  });

  it("enforces wetness-combustibility invariant in schema parsing", () => {
    const soakedTorch = {
      item_id: "item_resin_torch",
      material_class: "ORGANIC_WOOD" as const,
      wetness_bps: 8500, // Soaked in canal
      corrosion_bps: 0,
      structural_integrity_bps: 10000,
      damage_threshold_bps: 200,
      combustibility_tier: "IGNITABLE" as const, // Contradiction: soaked item cannot be ignitable
      is_operable: true,
      updated_at_epoch: 0,
    };

    expect(() => MaterialStateVectorSchema.parse(soakedTorch)).toThrow(
      /WETNESS_COMBUSTION_INVARIANT_BREACH/
    );
  });

  it("enforces zero structural integrity implies inoperable", () => {
    const shatteredWrench = {
      item_id: "item_pipe_wrench",
      material_class: "METALLIC" as const,
      wetness_bps: 0,
      corrosion_bps: 2000,
      structural_integrity_bps: 0, // Shattered
      damage_threshold_bps: 1000,
      combustibility_tier: "IMMUNE" as const,
      is_operable: true, // Contradiction: broken item cannot be operable
      updated_at_epoch: 0,
    };

    expect(() => MaterialStateVectorSchema.parse(shatteredWrench)).toThrow(
      /ZERO_INTEGRITY_INOPERABLE_BREACH/
    );
  });

  it("halts ignition of wet items via MaterialFeasibilitySolver at T0 = $0.00", () => {
    const wetMatches: MaterialStateVector = {
      item_id: "item_matches",
      material_class: "ORGANIC_WOOD",
      wetness_bps: 4500, // Wet
      corrosion_bps: 0,
      structural_integrity_bps: 10000,
      damage_threshold_bps: 50,
      combustibility_tier: "IMMUNE",
      is_operable: true,
      updated_at_epoch: 0,
    };

    const op: AttemptedOperation = {
      actor_id: "char_silas",
      item_id: "item_matches",
      operation_type: "IGNITE",
      applied_energy_bps: 100,
    };

    const result = MaterialFeasibilitySolver.evaluateOperation(wetMatches, op);
    expect(result.satisfiable).toBe(false);
    expect(result.errorCode).toBe("COMBUSTION_IMPOSSIBILITY_HALT");
    expect(result.errorVector?.rule_id).toBe("COMBUSTION_IMPOSSIBILITY_HALT");
  });

  it("halts mechanical operation on severely corroded metal tools", () => {
    const rustedWinch: MaterialStateVector = {
      item_id: "item_sluice_winch",
      material_class: "METALLIC",
      wetness_bps: 1000,
      corrosion_bps: 9400, // Rust-seized (>9000)
      structural_integrity_bps: 8000,
      damage_threshold_bps: 1500,
      combustibility_tier: "IMMUNE",
      is_operable: true,
      updated_at_epoch: 0,
    };

    const op: AttemptedOperation = {
      actor_id: "char_bog",
      item_id: "item_sluice_winch",
      operation_type: "OPERATE_MECHANISM",
      applied_energy_bps: 2000,
    };

    const result = MaterialFeasibilitySolver.evaluateOperation(rustedWinch, op);
    expect(result.satisfiable).toBe(false);
    expect(result.errorCode).toBe("MECHANICAL_SEIZURE_HALT");
    expect(result.errorVector?.offending_tokens).toContain("corrosion_bps: 9400");
  });

  it("absorbs sub-threshold impact energy without structural degradation", () => {
    const stoneBlock: MaterialStateVector = {
      item_id: "item_masonry_stone",
      material_class: "STONE",
      wetness_bps: 0,
      corrosion_bps: 0,
      structural_integrity_bps: 10000,
      damage_threshold_bps: 2500, // High DT
      combustibility_tier: "IMMUNE",
      is_operable: true,
      updated_at_epoch: 0,
    };

    const op: AttemptedOperation = {
      actor_id: "char_wart",
      item_id: "item_masonry_stone",
      operation_type: "STRIKE_IMPACT",
      applied_energy_bps: 2000, // Less than DT
    };

    const result = MaterialFeasibilitySolver.evaluateOperation(stoneBlock, op);
    expect(result.satisfiable).toBe(true);
    expect(result.updatedMaterialState?.structural_integrity_bps).toBe(10000);
  });

  it("degrades structural integrity when impact exceeds damage threshold", () => {
    const clayVessel: MaterialStateVector = {
      item_id: "item_water_jar",
      material_class: "GLASS_CERAMIC",
      wetness_bps: 500,
      corrosion_bps: 0,
      structural_integrity_bps: 3000,
      damage_threshold_bps: 300,
      combustibility_tier: "IMMUNE",
      is_operable: true,
      updated_at_epoch: 0,
    };

    const op: AttemptedOperation = {
      actor_id: "char_silas",
      item_id: "item_water_jar",
      operation_type: "STRIKE_IMPACT",
      applied_energy_bps: 3500, // Exceeds DT and remaining integrity
    };

    const result = MaterialFeasibilitySolver.evaluateOperation(clayVessel, op);
    expect(result.satisfiable).toBe(true);
    expect(result.updatedMaterialState?.structural_integrity_bps).toBe(0);
    expect(result.updatedMaterialState?.is_operable).toBe(false);
  });

  it("persists and queries material state in local SQLite with round-trip fidelity", () => {
    const lantern: MaterialStateVector = {
      item_id: "item_brass_lantern",
      material_class: "METALLIC",
      wetness_bps: 9000,
      corrosion_bps: 4000,
      structural_integrity_bps: 8500,
      damage_threshold_bps: 600,
      combustibility_tier: "IMMUNE",
      is_operable: true,
      updated_at_epoch: 100,
    };

    db.prepare(`
      INSERT INTO material_states (
        item_id, material_class, wetness_bps, corrosion_bps, structural_integrity_bps,
        damage_threshold_bps, combustibility_tier, is_operable, updated_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      lantern.item_id,
      lantern.material_class,
      lantern.wetness_bps,
      lantern.corrosion_bps,
      lantern.structural_integrity_bps,
      lantern.damage_threshold_bps,
      lantern.combustibility_tier,
      lantern.is_operable ? 1 : 0,
      lantern.updated_at_epoch
    );

    const row = db
      .prepare("SELECT * FROM material_states WHERE item_id = ?")
      .get("item_brass_lantern") as {
      item_id: string;
      material_class: string;
      wetness_bps: number;
      corrosion_bps: number;
      structural_integrity_bps: number;
      damage_threshold_bps: number;
      combustibility_tier: string;
      is_operable: number;
      updated_at_epoch: number;
    };

    expect(row).toBeDefined();
    expect(row.wetness_bps).toBe(9000);
    expect(row.is_operable).toBe(1);
    expect(row.combustibility_tier).toBe("IMMUNE");
  });
});
