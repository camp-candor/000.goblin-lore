import { z } from 'zod';

export const EpistemologicalStandingEnum = z.enum([
  'ACTIVE_ENDORSED',
  'FLAGGED_FOR_REVIEW',
  'DEPRECATED_ARCHIVED'
]);
export type EpistemologicalStanding = z.infer<typeof EpistemologicalStandingEnum>;

export const StandingTransitionRecordSchema = z.object({
  entity_id: z.string().min(1),
  previous_standing: EpistemologicalStandingEnum,
  new_standing: EpistemologicalStandingEnum,
  reconsidered_by: z.string().min(1),
  timestamp_epoch: z.number().int().nonnegative(),
  reason: z.string().min(1),
  audit_priority_score: z.number().nonnegative().default(0)
}).strict();
export type StandingTransitionRecord = z.infer<typeof StandingTransitionRecordSchema>;

export const EntityStandingMetadataSchema = z.object({
  standing: EpistemologicalStandingEnum.default('ACTIVE_ENDORSED'),
  last_reconsidered_at: z.number().int().nonnegative().default(0),
  reconsidered_by: z.string().default('system_genesis'),
  review_notes: z.string().optional()
}).strict();
export type EntityStandingMetadata = z.infer<typeof EntityStandingMetadataSchema>;

/**
 * Computes the logarithmic review tension metric:
 * Audit Priority Score = Days Since Reconsideration * log10(Downstream Dependent Scenes + 1)
 */
export function calculateAuditPriorityScore(
  daysSinceReconsideration: number,
  downstreamDependentScenes: number
): number {
  const safeDays = Math.max(0, daysSinceReconsideration);
  const safeScenes = Math.max(0, downstreamDependentScenes);
  const rawScore = safeDays * Math.log10(safeScenes + 1);
  return Math.round(rawScore * 100) / 100;
}
