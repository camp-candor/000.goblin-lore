import { z } from 'zod'
import {
    TriStateStandingEnum,
    TriStateStanding,
} from '../../38.types.unit/val/standing.val.js'

/**
 * Zod validation schema for standing state transitions.
 * Ensures that both source and target states belong strictly to TriStateStanding.
 */
export const StandingTransitionSchema = z
    .object({
        currentStanding: TriStateStandingEnum,
        proposedStanding: TriStateStandingEnum,
        claimTextMutated: z.boolean(),
        contentHashMutated: z.boolean(),
        currentVersion: z.number().int().min(1),
        proposedVersion: z.number().int().min(1),
    })
    .strict()

export type StandingTransitionInput = z.infer<typeof StandingTransitionSchema>
