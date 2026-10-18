import { z } from "zod";

// ---------------------------------------------------------------------------
// 1. Dependency Edge & Status Enumerations
// ---------------------------------------------------------------------------
export const ProvisionalStatusEnum = z.enum([
  "ACTIVE_PINNED",
  "PROVISIONAL_PENDING_MERGE",
]);
export type ProvisionalStatus = z.infer<typeof ProvisionalStatusEnum>;

export const SceneStatusEnum = z.enum([
  "DRAFT",
  "PENDING_REVALIDATION",
  "DIRTY",
  "REVIEWED",
  "CLEAN",
]);
export type SceneStatus = z.infer<typeof SceneStatusEnum>;

// ---------------------------------------------------------------------------
// 2. Dependency Edge Schema (Strict Upstream Fact Binding)
// ---------------------------------------------------------------------------
export const DependencyEdgeSchema = z
  .object({
    fact_id: z
      .string()
      .regex(
        /^fact_[a-z0-9_]+$/,
        "Target fact_id must follow snake_case format prefixed with fact_"
      ),
    pinned_version: z
      .number()
      .int()
      .min(1, "pinned_version must be an integer >= 1"),
    pinned_hash: z
      .string()
      .regex(
        /^[0-9a-f]{64}$/,
        "pinned_hash must be a 64-character lowercase SHA-256"
      ),
    provisional_status: ProvisionalStatusEnum.default("ACTIVE_PINNED"),
  })
  .strict();

export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;

// ---------------------------------------------------------------------------
// 3. Scene Contract Schema (Point-of-Composition Completion Fence)
// ---------------------------------------------------------------------------
export const SceneContractSchema = z
  .object({
    id: z
      .string()
      .regex(
        /^scene_[a-z0-9_]+$/,
        "Scene ID must follow snake_case format prefixed with scene_"
      ),
    episode_num: z.number().int().min(1, "episode_num must be an integer >= 1"),
    scene_num: z.number().int().min(1, "scene_num must be an integer >= 1"),
    status: SceneStatusEnum.default("DRAFT"),
    depends_on: z.array(DependencyEdgeSchema).default([]),
    asserts_zero_dependencies: z.boolean().default(false),
    dirty_reasons: z.array(z.string()).default([]),
    created_at_epoch: z.number().int().min(0).default(0),
    updated_at_epoch: z.number().int().min(0).default(0),
  })
  .strict()
  .superRefine((data, ctx) => {
    // The Completion Fence Invariant: A scene cannot achieve CLEAN status
    // without declaring explicit dependencies OR explicitly certifying zero dependencies
    if (data.status === "CLEAN") {
      if (data.depends_on.length === 0 && !data.asserts_zero_dependencies) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "COMPLETION_FENCE_BREACH: Scene cannot achieve CLEAN status with empty depends_on array without explicitly asserting asserts_zero_dependencies: true",
          path: ["depends_on"],
        });
      }

      if (data.depends_on.length > 0 && data.asserts_zero_dependencies) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            "CONTRADICTORY_ZERO_DEPENDENCY_DECLARATION: Scene declares asserts_zero_dependencies: true while simultaneously populating depends_on array",
          path: ["asserts_zero_dependencies"],
        });
      }
    }
  });

export type SceneContract = z.infer<typeof SceneContractSchema>;