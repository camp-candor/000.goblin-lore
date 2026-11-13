import { z } from 'zod'
import { BasisPointSchema } from '../../38.types.unit/fce/capacityMetric.interface.js'

export const LocomotionBaselineEnum = z.enum([
    'bipedal_standard',
    'bipedal_hunched',
    'limping',
    'quadrupedal',
    'slithering',
    'aerial',
])

export const SomaticLimbCapacitySchema = z
    .object({
        arms_available_bps: BasisPointSchema,
        locomotion_baseline: LocomotionBaselineEnum,
        banned_kinetic_verbs: z.array(z.string().min(1)).default([]),
    })
    .strict()

export type SomaticLimbCapacity = z.infer<typeof SomaticLimbCapacitySchema>

export const CombatAttributeStatsSchema = z
    .object({
        spite: z.number().int().min(1).max(5).default(3),
        cunning: z.number().int().min(1).max(5).default(3),
        vigor: z.number().int().min(1).max(5).default(3),
        poise: z.number().int().min(1).max(5).default(3),
    })
    .strict()

export type CombatAttributeStats = z.infer<typeof CombatAttributeStatsSchema>

export const EntityCapacityConfigurationSchema = z
    .object({
        entity_id: z.string().regex(/^(char|loc|item|grv)_[a-z0-9_]+$/),
        somatic_capacity: SomaticLimbCapacitySchema,
        combat_stats: CombatAttributeStatsSchema,
    })
    .strict()

export type EntityCapacityConfiguration = z.infer<
    typeof EntityCapacityConfigurationSchema
>
