import { z } from 'zod'
import { LocomotionBaselineEnum } from '../../19.locomotion.unit/val/locomotion.val.js'

/**
 * Closed enumeration of canonical biological and synthetic species taxonomies.
 */
export const SpeciesEnum = z.enum([
    'goblinoid', // Floorboard and crawlspace goblin archetypes
    'humanoid_industrial', // Standard human laborers and operatives
    'arachnid_automaton', // Multipedal mechanical constructs
    'sessile_fungoid', // Spore colonies and rooted bio-nodes
    'quadruped_beast', // Draft beasts and vermin
])
export type Species = z.infer<typeof SpeciesEnum>

/**
 * Sensory baseline acuity ratings evaluated in integer basis points (0..10,000 bps).
 * 10,000 bps = 100% nominal human baseline.
 */
export const SensoryBaselinesSchema = z
    .object({
        optical_acuity_bps: z.number().int().min(0).max(10000),
        auditory_floor_cdb: z.number().int().min(0).max(10000),
        olfactory_acuity_bps: z.number().int().min(0).max(10000),
    })
    .strict()
export type SensoryBaselines = z.infer<typeof SensoryBaselinesSchema>

/**
 * Authoritative schema for shared species/class anatomical templates.
 * Enforces strict integer basis points: 10,000 bps = 1 functional limb.
 */
// prettier-ignore
export const SomaticArchetypeSchema = z.object({
  archetype_id: z.string().regex(/^arch_[a-z0-9_]+$/),
  species: SpeciesEnum,
  base_arms_bps: z.number().int().min(0).max(40000),
  base_legs_bps: z.number().int().min(0).max(40000),
  default_locomotion: LocomotionBaselineEnum,
  default_banned_verbs: z.array(z.string().min(1)),
  sensory_baselines: SensoryBaselinesSchema,
  description: z.string().min(1)
}).strict()
export type SomaticArchetype = z.infer<typeof SomaticArchetypeSchema>

/**
 * Schema for character frontmatter delta overrides.
 * Characters store only these deltas against their archetype template.
 */
export const SomaticDeltaSchema = z
    .object({
        archetype_id: z.string().regex(/^arch_[a-z0-9_]+$/),
        arms_delta_bps: z.number().int().min(-40000).max(0).default(0),
        legs_delta_bps: z.number().int().min(-40000).max(0).default(0),
        locomotion_override: LocomotionBaselineEnum.optional(),
        additional_banned_verbs: z.array(z.string().min(1)).default([]),
        active_conditions: z.array(z.string().min(1)).default([]),
    })
    .strict()
export type SomaticDelta = z.infer<typeof SomaticDeltaSchema>

/**
 * Fully resolved somatic profile resulting from archetype composition.
 */
export const ResolvedSomaticProfileSchema = z
    .object({
        archetype_id: z.string(),
        species: SpeciesEnum,
        effective_arms_bps: z.number().int().min(0).max(40000),
        effective_legs_bps: z.number().int().min(0).max(40000),
        locomotion_baseline: LocomotionBaselineEnum,
        banned_kinetic_verbs: z.array(z.string().min(1)),
        sensory_baselines: SensoryBaselinesSchema,
        active_conditions: z.array(z.string().min(1)),
    })
    .strict()
export type ResolvedSomaticProfile = z.infer<
    typeof ResolvedSomaticProfileSchema
>

/**
 * Default global archetype registry for core franchise species.
 */
export const DEFAULT_ARCHETYPES: Readonly<Record<string, SomaticArchetype>> =
    Object.freeze({
        arch_goblin_grunt: {
            archetype_id: 'arch_goblin_grunt',
            species: 'goblinoid',
            base_arms_bps: 20000,
            base_legs_bps: 20000,
            default_locomotion: 'bipedal_hunched',
            default_banned_verbs: ['sprint', 'vault'],
            sensory_baselines: {
                optical_acuity_bps: 8500,
                auditory_floor_cdb: 3500,
                olfactory_acuity_bps: 9500,
            },
            description:
                'Standard floorboard crawlspace goblin with keen low-light senses',
        },
        arch_human_operator: {
            archetype_id: 'arch_human_operator',
            species: 'humanoid_industrial',
            base_arms_bps: 20000,
            base_legs_bps: 20000,
            default_locomotion: 'bipedal_standard',
            default_banned_verbs: [],
            sensory_baselines: {
                optical_acuity_bps: 10000,
                auditory_floor_cdb: 2000,
                olfactory_acuity_bps: 5000,
            },
            description:
                'Baseline industrial human operative with standard athletic gait',
        },
        arch_crawlspace_automaton: {
            archetype_id: 'arch_crawlspace_automaton',
            species: 'arachnid_automaton',
            base_arms_bps: 0,
            base_legs_bps: 40000,
            default_locomotion: 'quadrupedal',
            default_banned_verbs: [
                'bimanual_lift',
                'dual_wield',
                'fine_manipulation',
            ],
            sensory_baselines: {
                optical_acuity_bps: 10000,
                auditory_floor_cdb: 5000,
                olfactory_acuity_bps: 0,
            },
            description:
                'Four-legged steel maintenance spider with zero upper manipulator arms',
        },
        arch_sessile_spore_node: {
            archetype_id: 'arch_sessile_spore_node',
            species: 'sessile_fungoid',
            base_arms_bps: 0,
            base_legs_bps: 0,
            default_locomotion: 'sessile',
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
            sensory_baselines: {
                optical_acuity_bps: 0,
                auditory_floor_cdb: 1000,
                olfactory_acuity_bps: 10000,
            },
            description:
                'Stationary fungal node with chemical olfactory awareness',
        },
    })

/**
 * Pure function to resolve an entity delta against a static somatic archetype.
 * Operates synchronously at Stage T_0 = $0.00.
 */
export function resolveArchetypeInheritance(
    archetype: SomaticArchetype,
    delta?: Partial<SomaticDelta>,
): ResolvedSomaticProfile {
    const parsedArchetype = SomaticArchetypeSchema.parse(archetype)
    const armsDelta = delta?.arms_delta_bps ?? 0
    const legsDelta = delta?.legs_delta_bps ?? 0

    const effectiveArms = Math.max(0, parsedArchetype.base_arms_bps + armsDelta)
    const effectiveLegs = Math.max(0, parsedArchetype.base_legs_bps + legsDelta)

    const locomotionBaseline =
        delta?.locomotion_override ?? parsedArchetype.default_locomotion

    // Union default banned verbs with delta banned verbs
    const verbSet = new Set<string>([
        ...parsedArchetype.default_banned_verbs,
        ...(delta?.additional_banned_verbs ?? []),
    ])

    // If effective arms degraded below 2.0 (20,000 bps), automatically ban bimanual actions
    if (effectiveArms < 20000) {
        verbSet.add('bimanual_lift')
        verbSet.add('dual_wield')
        verbSet.add('two_handed_strike')
    }

    const bannedVerbs = Array.from(verbSet).sort()

    return ResolvedSomaticProfileSchema.parse({
        archetype_id: parsedArchetype.archetype_id,
        species: parsedArchetype.species,
        effective_arms_bps: effectiveArms,
        effective_legs_bps: effectiveLegs,
        locomotion_baseline: locomotionBaseline,
        banned_kinetic_verbs: bannedVerbs,
        sensory_baselines: parsedArchetype.sensory_baselines,
        active_conditions: delta?.active_conditions ?? [],
    })
}
