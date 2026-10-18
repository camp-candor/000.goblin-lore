import { z } from 'zod';

export const EntityContentHashSchema = z.object({
  entity_id: z.string(),
  content_hash: z.string().length(64).regex(/^[0-9a-f]{64}$/),
  updated_at_epoch: z.number().int().min(0)
}).strict();

export const OneHopDependencySetSchema = z.object({
  target_id: z.string(),
  target_content_hash: z.string().length(64).regex(/^[0-9a-f]{64}$/),
  foreign_keys: z.array(EntityContentHashSchema),
  computed_h_dep: z.string().length(64).regex(/^[0-9a-f]{64}$/),
  pinned_at_epoch: z.number().int().min(0)
}).strict();

export const OneHopAdvisoryDiffSchema = z.object({
  target_id: z.string(),
  rebase_required: z.boolean(),
  current_h_dep: z.string().length(64).regex(/^[0-9a-f]{64}$/),
  mutated_foreign_keys: z.array(z.string()),
  advisory_message: z.string()
}).strict();
