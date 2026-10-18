
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import Database from "better-sqlite3";
import {
  SceneContractSchema,
  SceneContract,
} from '../src/schemas/dependencies.schema.js';
import {
  evaluateCompositionFence,
  auditSceneDependencies,
} from '../src/linters/compositionFence.js';

describe("Task MV-1.2: Point-of-Composition Completion Fence & Pinned Edge Validator", () => {
  let db: Database.Database;

  beforeEach(() => {
    db = new Database(":memory:");
    db.exec(`
      CREATE TABLE facts (
        id TEXT PRIMARY KEY,
        claim_text TEXT NOT NULL,
        scope TEXT NOT NULL,
        authority_level TEXT NOT NULL,
        standing TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        content_hash TEXT NOT NULL,
        author TEXT NOT NULL,
        created_at_epoch INTEGER NOT NULL,
        last_edited_epoch INTEGER NOT NULL
      );
    `);
  });

  afterEach(() => {
    db.close();
  });

  const validFactHash = "a".repeat(64);

  const insertFact = (id: string, version: number = 1, hash: string = validFactHash) => {
    db.prepare(`
      INSERT INTO facts (id, claim_text, scope, authority_level, standing, version, content_hash, author, created_at_epoch, last_edited_epoch)
      VALUES (?, 'Sample claim', 'LOGISTIC', 'CANON', 'ACTIVE_ENDORSED', ?, ?, 'Elena', 0, 0)
    `).run(id, version, hash);
  };

  const createSampleScene = (overrides: Partial<SceneContract> = {}): SceneContract => {
    return SceneContractSchema.parse({
      id: "scene_ep101_sc01",
      episode_num: 101,
      scene_num: 1,
      status: "DRAFT",
      depends_on: [],
      asserts_zero_dependencies: false,
      dirty_reasons: [],
      created_at_epoch: 0,
      updated_at_epoch: 0,
      ...overrides,
    });
  };

  it("enforces strict Zod validation rejecting un-schemaed properties", () => {
    const raw = {
      id: "scene_ep101_sc01",
      episode_num: 101,
      scene_num: 1,
      status: "DRAFT",
      depends_on: [],
      asserts_zero_dependencies: false,
      unauthorized_extra_field: "ILLEGAL_DATA",
    };

    expect(() => SceneContractSchema.parse(raw)).toThrow();
  });

  it("catches COMPLETION_FENCE_BREACH when transitioning to CLEAN with empty dependencies and no zero-dependency assert", () => {
    const scene = {
      id: "scene_ep101_sc02",
      episode_num: 101,
      scene_num: 2,
      status: "CLEAN",
      depends_on: [],
      asserts_zero_dependencies: false, // Breach!
    };

    const result = evaluateCompositionFence(scene);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("COMPLETION_FENCE_BREACH");
    expect(result.reason).toContain("cannot achieve CLEAN status with empty depends_on");
  });

  it("catches CONTRADICTORY_ZERO_DEPENDENCY_DECLARATION when asserting zero dependencies while populating depends_on", () => {
    const scene = {
      id: "scene_ep101_sc03",
      episode_num: 101,
      scene_num: 3,
      status: "CLEAN",
      depends_on: [
        {
          fact_id: "fact_culvert_key",
          pinned_version: 1,
          pinned_hash: validFactHash,
          provisional_status: "ACTIVE_PINNED",
        },
      ],
      asserts_zero_dependencies: true, // Contradiction!
    };

    const result = evaluateCompositionFence(scene);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("CONTRADICTORY_ZERO_DEPENDENCY_DECLARATION");
    expect(result.reason).toContain("declares asserts_zero_dependencies: true while simultaneously populating");
  });

  it("permits CLEAN status when scene explicitly declares asserts_zero_dependencies: true with empty depends_on", () => {
    const cleanNoDepsScene = createSampleScene({
      id: "scene_ep101_sc04",
      status: "CLEAN",
      depends_on: [],
      asserts_zero_dependencies: true,
    });

    const result = evaluateCompositionFence(cleanNoDepsScene);
    expect(result.valid).toBe(true);
  });

  it("permits CLEAN status when scene declares valid pinned dependency edges", () => {
    insertFact("fact_culvert_key", 1, validFactHash);

    const cleanSceneWithDeps = createSampleScene({
      id: "scene_ep101_sc05",
      status: "CLEAN",
      depends_on: [
        {
          fact_id: "fact_culvert_key",
          pinned_version: 1,
          pinned_hash: validFactHash,
          provisional_status: "ACTIVE_PINNED",
        },
      ],
      asserts_zero_dependencies: false,
    });

    const result = evaluateCompositionFence(cleanSceneWithDeps, db);
    expect(result.valid).toBe(true);
  });

  it("detects dangling fact references against the local SQLite ledger", () => {
    // fact_ghost_prop is NOT in the database
    const sceneWithDangling = createSampleScene({
      id: "scene_ep101_sc06",
      status: "CLEAN",
      depends_on: [
        {
          fact_id: "fact_ghost_prop",
          pinned_version: 1,
          pinned_hash: validFactHash,
          provisional_status: "ACTIVE_PINNED",
        },
      ],
      asserts_zero_dependencies: false,
    });

    const result = evaluateCompositionFence(sceneWithDangling, db);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("COMPOSITION_FENCE_DANGLING_FACT");
    expect(result.reason).toContain("does not exist in local SQLite ledger");
    expect(result.offendingEdges?.[0].fact_id).toBe("fact_ghost_prop");
  });

  it("detects stale version pins when upstream SQLite canon has advanced", () => {
    // Database has version 2
    insertFact("fact_siphon_intact", 2, validFactHash);

    // Scene is pinned to outdated version 1
    const sceneWithStalePin = createSampleScene({
      id: "scene_ep101_sc07",
      status: "CLEAN",
      depends_on: [
        {
          fact_id: "fact_siphon_intact",
          pinned_version: 1, // Stale!
          pinned_hash: validFactHash,
          provisional_status: "ACTIVE_PINNED",
        },
      ],
      asserts_zero_dependencies: false,
    });

    const result = evaluateCompositionFence(sceneWithStalePin, db);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("COMPOSITION_FENCE_STALE_PIN");
    expect(result.reason).toContain("Scene pinned to stale fact versions");
    expect(result.offendingEdges?.[0].pinned_version).toBe(1);
  });

  it("detects content_hash mismatches when fact content differs", () => {
    const dbHash = "b".repeat(64);
    insertFact("fact_pipe_valve", 1, dbHash);

    const sceneWithMismatchedHash = createSampleScene({
      id: "scene_ep101_sc08",
      status: "CLEAN",
      depends_on: [
        {
          fact_id: "fact_pipe_valve",
          pinned_version: 1,
          pinned_hash: "c".repeat(64), // Mismatched!
          provisional_status: "ACTIVE_PINNED",
        },
      ],
      asserts_zero_dependencies: false,
    });

    const result = evaluateCompositionFence(sceneWithMismatchedHash, db);
    expect(result.valid).toBe(false);
    expect(result.errorCode).toBe("COMPOSITION_FENCE_HASH_MISMATCH");
    expect(result.reason).toContain("pinned_hash does not match current SQLite content_hash");
  });

  it("audits batches of scenes and isolates non-compliant breaches", () => {
    insertFact("fact_valid_1", 1, validFactHash);

    const batch = [
      createSampleScene({
        id: "scene_ep101_sc09",
        status: "CLEAN",
        depends_on: [
          { fact_id: "fact_valid_1", pinned_version: 1, pinned_hash: validFactHash, provisional_status: "ACTIVE_PINNED" },
        ],
      }),
      {
        id: "scene_ep101_sc10",
        episode_num: 101,
        scene_num: 10,
        status: "CLEAN",
        depends_on: [],
        asserts_zero_dependencies: false, // Breach!
      },
    ];

    const audit = auditSceneDependencies(batch, db);
    expect(audit.cleanScenesCount).toBe(1);
    expect(audit.breachedScenes).toHaveLength(1);
    expect(audit.breachedScenes[0].sceneId).toBe("scene_ep101_sc10");
  });
});
