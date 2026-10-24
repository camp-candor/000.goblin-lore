import { z } from 'zod'

export const LocationIdentifierSchema = z
    .string()
    .regex(/^loc_[a-z0-9_]+$/, 'Location ID must match regex ^loc_[a-z0-9_]+$')

export const DynamicOccluderSchema = z
    .object({
        occluder_id: z.string().min(1, 'Occluder identifier is required'),
        default_state: z.enum(['OPEN', 'SHUT', 'LOCKED']),
        acoustic_damping_penalty_cdb: z
            .number()
            .int()
            .min(0)
            .max(10000, 'Maximum damping penalty is 10000 cdB'),
    })
    .strict()

export const LocationFrontmatterSchema = z
    .object({
        id: LocationIdentifierSchema,
        type: z.literal('location'),
        name: z.string().min(1, 'Location name is required'),
        max_adult_goblins: z
            .number()
            .int()
            .min(1, 'Location capacity must accommodate at least 1 goblin')
            .max(100, 'Location capacity ceiling is 100'),
        acoustic_damping_cdb: z
            .number()
            .int()
            .min(500, 'Acoustic damping floor is 500 cdB')
            .max(10000, 'Acoustic damping ceiling is 10000 cdB'),
        ambient_noise_cdb: z
            .number()
            .int()
            .min(0, 'Ambient noise floor is 0 cdB')
            .max(12000, 'Ambient noise ceiling is 12000 cdB'),
        connected_locations: z.array(LocationIdentifierSchema).default([]),
        dynamic_occluders: z.array(DynamicOccluderSchema).default([]),
        created_epoch: z.number().int().min(0).default(0),
        last_updated_epoch: z.number().int().min(0).default(0),
    })
    .strict()

export type LocationFrontmatter = z.infer<typeof LocationFrontmatterSchema>
