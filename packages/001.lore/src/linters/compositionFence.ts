import Database from "better-sqlite3";
import {
  SceneContractSchema,
  DependencyEdge,
} from "../schemas/dependencies.schema.js";

export interface CompositionFenceResult {
  valid: boolean;
  sceneId: string;
  errorCode?:
    | "COMPLETION_FENCE_BREACH"
    | "CONTRADICTORY_ZERO_DEPENDENCY_DECLARATION"
    | "COMPOSITION_FENCE_DANGLING_FACT"
    | "COMPOSITION_FENCE_STALE_PIN"
    | "COMPOSITION_FENCE_HASH_MISMATCH"
    | "SCHEMA_VALIDATION_ERROR";
  reason?: string;
  offendingEdges?: DependencyEdge[];
}

export interface FactRow {
  id: string;
  version: number;
  content_hash: string;
  standing: string;
}

/**
 * Evaluates the Point-of-Composition Completion Fence at Stage T0 = $0.00:
 * 1. Validates scene shape against SceneContractSchema.
 * 2. Enforces non-empty dependencies or explicit asserts_zero_dependencies for CLEAN scenes.
 * 3. Cross-references local SQLite database to detect dangling facts or stale version pins.
 */
export function evaluateCompositionFence(
  scene: unknown,
  db?: Database.Database
): CompositionFenceResult {
  // Step 1: Structural Schema Validation
  const parseResult = SceneContractSchema.safeParse(scene);
  if (!parseResult.success) {
    const primaryIssue = parseResult.error.issues[0];
    const isFenceBreach = primaryIssue.message.includes("COMPLETION_FENCE_BREACH");
    const isContradiction = primaryIssue.message.includes(
      "CONTRADICTORY_ZERO_DEPENDENCY_DECLARATION"
    );

    const sceneId =
      typeof scene === "object" && scene !== null && "id" in scene
        ? String((scene as { id: unknown }).id)
        : "unknown_scene";

    return {
      valid: false,
      sceneId,
      errorCode: isFenceBreach
        ? "COMPLETION_FENCE_BREACH"
        : isContradiction
        ? "CONTRADICTORY_ZERO_DEPENDENCY_DECLARATION"
        : "SCHEMA_VALIDATION_ERROR",
      reason: primaryIssue.message,
    };
  }

  const validScene = parseResult.data;

  // Step 2: Relational SQLite Ledger Verification (if db is provided)
  if (db && validScene.status === "CLEAN" && validScene.depends_on.length > 0) {
    const getFactStmt = db.prepare(
      "SELECT id, version, content_hash, standing FROM facts WHERE id = ?"
    );

    const danglingEdges: DependencyEdge[] = [];
    const staleEdges: DependencyEdge[] = [];
    const mismatchedHashEdges: DependencyEdge[] = [];

    for (const edge of validScene.depends_on) {
      const fact = getFactStmt.get(edge.fact_id) as FactRow | undefined;

      if (!fact) {
        danglingEdges.push(edge);
        continue;
      }

      if (edge.pinned_version < fact.version) {
        staleEdges.push(edge);
      } else if (edge.pinned_hash.toLowerCase() !== fact.content_hash.toLowerCase()) {
        mismatchedHashEdges.push(edge);
      }
    }

    if (danglingEdges.length > 0) {
      return {
        valid: false,
        sceneId: validScene.id,
        errorCode: "COMPOSITION_FENCE_DANGLING_FACT",
        reason: `Dangling fact reference detected: ${danglingEdges
          .map((e) => e.fact_id)
          .join(", ")} does not exist in local SQLite ledger`,
        offendingEdges: danglingEdges,
      };
    }

    if (staleEdges.length > 0) {
      return {
        valid: false,
        sceneId: validScene.id,
        errorCode: "COMPOSITION_FENCE_STALE_PIN",
        reason: `Scene pinned to stale fact versions: ${staleEdges
          .map((e) => `${e.fact_id}@v${e.pinned_version}`)
          .join(", ")}. Upstream canon has advanced`,
        offendingEdges: staleEdges,
      };
    }

    if (mismatchedHashEdges.length > 0) {
      return {
        valid: false,
        sceneId: validScene.id,
        errorCode: "COMPOSITION_FENCE_HASH_MISMATCH",
        reason: `Scene pinned_hash does not match current SQLite content_hash for facts: ${mismatchedHashEdges
          .map((e) => e.fact_id)
          .join(", ")}`,
        offendingEdges: mismatchedHashEdges,
      };
    }
  }

  return {
    valid: true,
    sceneId: validScene.id,
  };
}

/**
 * Audits a collection of scenes and returns all offending non-compliant scenes
 */
export function auditSceneDependencies(
  scenes: unknown[],
  db?: Database.Database
): {
  cleanScenesCount: number;
  breachedScenes: CompositionFenceResult[];
} {
  const breachedScenes: CompositionFenceResult[] = [];
  let cleanScenesCount = 0;

  for (const rawScene of scenes) {
    const result = evaluateCompositionFence(rawScene, db);
    if (!result.valid) {
      breachedScenes.push(result);
    } else {
      cleanScenesCount++;
    }
  }

  return {
    cleanScenesCount,
    breachedScenes,
  };
}