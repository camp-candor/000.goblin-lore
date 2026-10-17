import { z } from 'zod'

export const StandingStateEnum = z.enum([
    'ACTIVE_ENDORSED',
    'FLAGGED_FOR_REVIEW',
    'DEPRECATED_ARCHIVED',
])

export type StandingState = z.infer<typeof StandingStateEnum>

export const FactStandingMetadataSchema = z
    .object({
        fact_id: z.string().regex(/^fact_[a-z0-9_]+$/),
        standing: StandingStateEnum.default('ACTIVE_ENDORSED'),
        last_reconsidered_epoch: z.number().int().min(0).default(0),
        review_notes: z.string().optional(),
        flagged_by: z.string().optional(),
        flagged_at_epoch: z.number().int().min(0).optional(),
    })
    .strict()

export type FactStandingMetadata = z.infer<typeof FactStandingMetadataSchema>

/**
 * Calculates logarithmic review tension score:
 * Score = DaysSinceReconsideration * log10(DownstreamDependentScenes + 1)
 */
export function calculateAuditPriorityScore(
    daysSinceReconsideration: number,
    downstreamDependentScenes: number,
): number {
    const safeDays = Math.max(0, daysSinceReconsideration)
    const safeScenes = Math.max(0, downstreamDependentScenes)
    const rawScore = safeDays * Math.log10(safeScenes + 1)
    return Math.round(rawScore * 100) / 100
}
