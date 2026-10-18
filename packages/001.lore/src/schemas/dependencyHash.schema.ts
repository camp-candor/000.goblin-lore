import { z } from "zod";

// ---------------------------------------------------------------------------
// 1. Entity Content Hash Schema
// ---------------------------------------------------------------------------
export const EntityContentHashSchema = z
  .object({
    entity_id: z.string().min(1),
    content_hash: z.string().regex(/^[a-f0-9]{64}$/),
    updated_at_epoch: z.number().int().min(0),
  })
  .strict();

export type EntityContentHash = z.infer<typeof EntityContentHashSchema>;

// ---------------------------------------------------------------------------
// 2. One-Hop Dependency Set Schema
// ---------------------------------------------------------------------------
export const OneHopDependencySetSchema = z
  .object({
    target_id: z.string().min(1),
    target_content_hash: z.string().regex(/^[a-f0-9]{64}$/),
    foreign_keys: z.array(EntityContentHashSchema),
    computed_h_dep: z.string().regex(/^[a-f0-9]{64}$/),
    pinned_at_epoch: z.number().int().min(0),
  })
  .strict();

export type OneHopDependencySet = z.infer<typeof OneHopDependencySetSchema>;

// ---------------------------------------------------------------------------
// 3. One-Hop Advisory Diff Schema
// ---------------------------------------------------------------------------
export const OneHopAdvisoryDiffSchema = z
  .object({
    target_id: z.string().min(1),
    rebase_required: z.boolean(),
    mutated_foreign_keys: z.array(z.string()),
    previous_h_dep: z.string().regex(/^[a-f0-9]{64}$/),
    current_h_dep: z.string().regex(/^[a-f0-9]{64}$/),
    advisory_message: z.string(),
  })
  .strict();

export type OneHopAdvisoryDiff = z.infer<typeof OneHopAdvisoryDiffSchema>;
