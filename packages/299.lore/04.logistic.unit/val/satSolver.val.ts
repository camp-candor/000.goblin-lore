import { z } from 'zod'

/**
 * Discrete physiological status for each anatomical upper extremity.
 */
export const LimbStateEnum = z.enum([
    'INTACT',
    'IMPAIRED',
    'PARALYZED',
    'AMPUTATED',
])
export type LimbState = z.infer<typeof LimbStateEnum>

/**
 * Designated physical extremity target.
 */
export const HandednessEnum = z.enum(['LEFT', 'RIGHT', 'EITHER', 'BIMANUAL'])
export type Handedness = z.infer<typeof HandednessEnum>

/**
 * Structured specification of an action or tool manipulation attempt.
 */
export const ActionHandDemandSchema = z
    .object({
        action_id: z.string().regex(/^act_[a-z0-9_]+$/),
        occupies_hands: z.number().int().min(1).max(2).default(1),
        occupies_hands_bps: z
            .number()
            .int()
            .min(10000)
            .max(20000)
            .default(10000),
        demanded_handedness: HandednessEnum.default('EITHER'),
        required_kinetic_verbs: z.array(z.string()).default([]),
    })
    .strict()
export type ActionHandDemand = z.infer<typeof ActionHandDemandSchema>

/**
 * Somatic upper-limb capability profile used by the SAT solver.
 */
export const SomaticLimbProfileSchema = z
    .object({
        actor_id: z.string().regex(/^char_[a-z0-9_]+$/),
        locomotion_baseline: z.string().default('bipedal_standard'),
        left_arm_state: LimbStateEnum.default('INTACT'),
        right_arm_state: LimbStateEnum.default('INTACT'),
        banned_kinetic_verbs: z.array(z.string()).default([]),
    })
    .strict()
export type SomaticLimbProfile = z.infer<typeof SomaticLimbProfileSchema>

/**
 * Full SAT Solver Evaluation Input Payload.
 */
export const PreflightSatEvaluationInputSchema = z
    .object({
        somatic_profile: SomaticLimbProfileSchema,
        currently_held_items: z.array(
            z
                .object({
                    item_id: z.string().regex(/^item_[a-z0-9_]+$/),
                    occupies_hands_bps: z.number().int().min(10000).max(20000),
                    equipped_arm: z
                        .enum(['LEFT', 'RIGHT', 'UNASSIGNED'])
                        .default('UNASSIGNED'),
                })
                .strict(),
        ),
        proposed_action: ActionHandDemandSchema,
    })
    .strict()
export type PreflightSatEvaluationInput = z.infer<
    typeof PreflightSatEvaluationInputSchema
>
