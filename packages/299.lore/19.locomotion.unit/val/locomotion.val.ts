import { z } from 'zod'

export const VALID_LOCOMOTION_BASELINES = [
    'bipedal_standard',
    'bipedal_hunched',
    'quadrupedal',
    'slithering',
    'brachiation',
    'sessile',
    'limping',
    'neuropathy_shuffle',
    'heavy_grounded_slog',
] as const

export const LocomotionBaselineEnum = z.enum(VALID_LOCOMOTION_BASELINES)

export type LocomotionBaseline = z.infer<typeof LocomotionBaselineEnum>

export interface LocomotionProfile {
    readonly baseline: LocomotionBaseline
    readonly label: string
    readonly max_velocity_bps: number
    readonly default_arms_bps: number
    readonly default_banned_verbs: readonly string[]
}

export const LOCOMOTION_PROFILES: Readonly<
    Record<LocomotionBaseline, LocomotionProfile>
> = Object.freeze({
    bipedal_standard: {
        baseline: 'bipedal_standard',
        label: 'bipedal_standard (10,000 bps | 1.00x)',
        max_velocity_bps: 10000,
        default_arms_bps: 20000,
        default_banned_verbs: [],
    },
    bipedal_hunched: {
        baseline: 'bipedal_hunched',
        label: 'bipedal_hunched (8,000 bps | 0.80x)',
        max_velocity_bps: 8000,
        default_arms_bps: 20000,
        default_banned_verbs: ['sprint', 'vault'],
    },
    quadrupedal: {
        baseline: 'quadrupedal',
        label: 'quadrupedal (9,000 bps | 0.90x)',
        max_velocity_bps: 9000,
        default_arms_bps: 0,
        default_banned_verbs: ['bimanual_lift'],
    },
    slithering: {
        baseline: 'slithering',
        label: 'slithering (3,500 bps | 0.35x)',
        max_velocity_bps: 3500,
        default_arms_bps: 0,
        default_banned_verbs: ['bimanual_lift', 'grasp', 'climb'],
    },
    brachiation: {
        baseline: 'brachiation',
        label: 'brachiation (6,500 bps | 0.65x)',
        max_velocity_bps: 6500,
        default_arms_bps: 20000,
        default_banned_verbs: ['sprint'],
    },
    sessile: {
        baseline: 'sessile',
        label: 'sessile (0 bps | 0.00x)',
        max_velocity_bps: 0,
        default_arms_bps: 0,
        default_banned_verbs: ['walk', 'run', 'sprint', 'climb', 'leap'],
    },
    limping: {
        baseline: 'limping',
        label: 'limping (5,000 bps | 0.50x)',
        max_velocity_bps: 5000,
        default_arms_bps: 20000,
        default_banned_verbs: ['sprint', 'vault', 'leap', 'scramble'],
    },
    neuropathy_shuffle: {
        baseline: 'neuropathy_shuffle',
        label: 'neuropathy_shuffle (4,000 bps | 0.40x)',
        max_velocity_bps: 4000,
        default_arms_bps: 20000,
        default_banned_verbs: [
            'sprint',
            'vault',
            'leap',
            'rapid_stairs',
            'dive',
        ],
    },
    heavy_grounded_slog: {
        baseline: 'heavy_grounded_slog',
        label: 'heavy_grounded_slog (4,500 bps | 0.45x)',
        max_velocity_bps: 4500,
        default_arms_bps: 20000,
        default_banned_verbs: ['leap', 'sprint'],
    },
})

export function validateLocomotionBaseline(raw: unknown): LocomotionBaseline {
    return LocomotionBaselineEnum.parse(raw)
}

export function resolveLocomotionProfile(
    baseline: LocomotionBaseline,
): LocomotionProfile {
    return LOCOMOTION_PROFILES[baseline]
}
