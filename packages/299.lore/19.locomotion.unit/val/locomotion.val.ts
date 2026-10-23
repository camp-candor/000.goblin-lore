import { z } from 'zod'

/**
 * Closed enumeration of canonical locomotion baselines across the storyworld.
 * Dictates invariant physical gait, velocity scaling, and default limb capabilities.
 */
export const LocomotionBaselineEnum = z.enum([
    'bipedal_standard', // Peak athletic mobility, 2 arms default
    'bipedal_hunched', // Low-clearance crawlspace gait (Wart, Spleen)
    'quadrupedal', // Four-legged locomotion
    'slithering', // Ground-contact serpentine movement; 0 functional arms
    'brachiation', // Arboreal/pipe swing locomotion
    'sessile', // Stationary; 0 functional arms
    'limping', // Asymmetric single-leg load bearing
    'neuropathy_shuffle', // Low-velocity, zero toe-lift, unsteady footing
    'heavy_grounded_slog', // High-inertia dragging gait
])
export type LocomotionBaseline = z.infer<typeof LocomotionBaselineEnum>

/**
 * Deterministic profile metadata for a locomotion baseline.
 * Enforces integer basis points (bps) where 10000 bps = 100% full velocity.
 */
export const LocomotionProfileSchema = z
    .object({
        baseline: LocomotionBaselineEnum,
        max_velocity_bps: z.number().int().min(0).max(10000),
        default_arms_bps: z.number().int().min(0).max(20000),
        default_banned_verbs: z.array(z.string().min(1)),
        description: z.string().min(1),
    })
    .strict()
export type LocomotionProfile = z.infer<typeof LocomotionProfileSchema>

/**
 * Authoritative lookup table mapping each locomotion baseline to its
 * physical constraints, velocity ceilings, and compiled negative verb masks.
 */
export const LOCOMOTION_PROFILES: Readonly<
    Record<LocomotionBaseline, LocomotionProfile>
> = Object.freeze({
    bipedal_standard: {
        baseline: 'bipedal_standard',
        max_velocity_bps: 10000,
        default_arms_bps: 20000,
        default_banned_verbs: [],
        description:
            'Unrestricted bipedal mobility with full dual-arm articulation',
    },
    bipedal_hunched: {
        baseline: 'bipedal_hunched',
        max_velocity_bps: 8000,
        default_arms_bps: 20000,
        default_banned_verbs: ['sprint', 'vault'],
        description:
            'Low-clearance hunched crawlspace gait with limited burst speed',
    },
    quadrupedal: {
        baseline: 'quadrupedal',
        max_velocity_bps: 9500,
        default_arms_bps: 0,
        default_banned_verbs: [
            'bimanual_lift',
            'dual_wield',
            'fine_manipulation',
        ],
        description:
            'Four-limbed locomotion dedicating forelimbs to weight bearing',
    },
    slithering: {
        baseline: 'slithering',
        max_velocity_bps: 6000,
        default_arms_bps: 0,
        default_banned_verbs: [
            'sprint',
            'vault',
            'leap',
            'climb_ladder',
            'bimanual_lift',
            'dual_wield',
        ],
        description:
            'Limbless ground traversal with zero functional arm capacity',
    },
    brachiation: {
        baseline: 'brachiation',
        max_velocity_bps: 8500,
        default_arms_bps: 20000,
        default_banned_verbs: ['sprint'],
        description:
            'Overhead conduit swinging requiring functional upper limbs',
    },
    sessile: {
        baseline: 'sessile',
        max_velocity_bps: 0,
        default_arms_bps: 0,
        default_banned_verbs: [
            'sprint',
            'run',
            'vault',
            'leap',
            'climb',
            'crawl',
            'hobble',
            'bimanual_lift',
            'dual_wield',
        ],
        description:
            'Physically anchored organism with zero translational locomotion',
    },
    limping: {
        baseline: 'limping',
        max_velocity_bps: 5000,
        default_arms_bps: 20000,
        default_banned_verbs: ['sprint', 'vault', 'leap', 'scramble'],
        description: 'Asymmetric single-leg gait requiring compensatory pauses',
    },
    neuropathy_shuffle: {
        baseline: 'neuropathy_shuffle',
        max_velocity_bps: 4000,
        default_arms_bps: 20000,
        default_banned_verbs: [
            'sprint',
            'vault',
            'leap',
            'rapid_stairs',
            'dive',
        ],
        description:
            'Unsteady shuffling gait with zero toe-lift and high stumble risk',
    },
    heavy_grounded_slog: {
        baseline: 'heavy_grounded_slog',
        max_velocity_bps: 4500,
        default_arms_bps: 20000,
        default_banned_verbs: ['sprint', 'vault', 'leap', 'acrobatic_dodge'],
        description: 'High-inertia dragging gait bound to floor contact',
    },
})

/**
 * Validates a candidate locomotion baseline and returns its compiled profile.
 */
export function validateLocomotionBaseline(
    candidate: unknown,
): LocomotionProfile {
    const parsedBaseline = LocomotionBaselineEnum.parse(candidate)
    return LOCOMOTION_PROFILES[parsedBaseline]
}
