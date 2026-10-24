import { z } from 'zod'

/**
 * Task identifier pattern for pending showrunner milestones.
 * e.g., "class_shift_150", "somatic_amputation_02", "exile_trial_final"
 */
export const ShowrunnerTaskIdSchema = z
    .string()
    .min(3, 'Task ID must be at least 3 characters')
    .max(64, 'Task ID must be at most 64 characters')
    .regex(
        /^[a-z0-9_]{3,64}$/,
        'Task ID must be lowercase alphanumeric ASCII between 3 and 64 characters',
    )

/**
 * Progression metadata contract embedded in character machine-rail frontmatter.
 */
export const CharacterProgressionSchema = z
    .object({
        level: z.number().int().min(1).default(1),
        xp: z.number().int().nonnegative().default(0),
        xp_per_cycle_survived: z.number().int().nonnegative().default(10),
        xp_bonus_no_backfire: z.number().int().nonnegative().default(5),
        // prettier-ignore
        pending_showrunner_task: ShowrunnerTaskIdSchema.nullable().default(null),
    })
    .strict()

export type CharacterProgression = z.infer<typeof CharacterProgressionSchema>

/**
 * Audit result contract for showrunner progression lock evaluation.
 */
export const ProgressionLockResultSchema = z
    .object({
        characterId: z.string().regex(/^char_[a-z0-9_]+$/),
        isLocked: z.boolean(),
        status: z.enum([
            'LOCKED_PENDING_SHOWRUNNER',
            'UNLOCKED_SIMULATION_PERMITTED',
        ]),
        pendingTask: ShowrunnerTaskIdSchema.nullable(),
        simulationPermitted: z.boolean(),
        isValid: z.boolean(),
        errorCode: z.string().optional(),
        message: z.string().optional(),
    })
    .strict()

export type ProgressionLockResult = z.infer<typeof ProgressionLockResultSchema>
