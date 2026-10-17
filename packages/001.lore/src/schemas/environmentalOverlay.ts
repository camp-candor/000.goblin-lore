import { z } from 'zod'

// ---------------------------------------------------------------------------
// 1. Environmental Zone State Schema
// ---------------------------------------------------------------------------
export const EnvironmentalZoneSchema = z
    .object({
        zone_id: z.string().regex(/^loc_[a-z0-9_]+$/),
        ambient_lux: z.number().int().min(0).max(100000).default(500), // Integer lux (0 = pitch black)
        flooded_depth_cm: z.number().int().min(0).max(10000).default(0), // Standing water level in cm
        mud_friction_bps: z.number().int().min(0).max(10000).default(0), // Locomotion resistance (10000 = impassable)
        airborne_particulate_bps: z.number().int().min(0).max(10000).default(0), // Dust/smoke density (10000 = opaque)
        acoustic_damping_cdb: z.number().int().min(0).max(10000).default(0), // Attenuation addition in centibels
        updated_at_epoch: z.number().int().min(0).default(0),
    })
    .strict()

export type EnvironmentalZone = z.infer<typeof EnvironmentalZoneSchema>

// ---------------------------------------------------------------------------
// 2. Dynamic Edge Transit Cost Schema
// ---------------------------------------------------------------------------
export const DynamicEdgeCostSchema = z
    .object({
        edge_id: z.string().min(1),
        multiplier_bps: z.number().int().min(0).max(50000).default(10000), // 10000 = 1.0x, 0 = impassable
        updated_at_tick: z.number().int().min(0).default(0),
    })
    .strict()

export type DynamicEdgeCost = z.infer<typeof DynamicEdgeCostSchema>

// ---------------------------------------------------------------------------
// 3. Locomotion Evaluation Input Schema
// ---------------------------------------------------------------------------
export const LocomotionEvaluationInputSchema = z
    .object({
        actor_id: z.string().regex(/^char_[a-z0-9_]+$/),
        base_movement_budget: z.number().int().min(0).default(100),
        attempted_verbs: z.array(z.string().min(1)).default([]),
        has_light_source: z.boolean().default(false),
    })
    .strict()

export type LocomotionEvaluationInput = z.infer<
    typeof LocomotionEvaluationInputSchema
>
