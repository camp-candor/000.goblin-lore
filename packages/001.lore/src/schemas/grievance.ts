import { z } from 'zod'

export const GrievanceCategoryEnum = z.enum([
    'resource_hoarding',
    'status_anxiety',
    'secret_keeping',
    'generational_rift',
    'territorial_boundary',
    'loyalty_tests',
    'domestic_sabotage',
])

export const IntensityEnvelopeSchema = z
    .object({
        min_intensity: z.number().int().min(1).max(5).default(1),
        max_intensity: z.number().int().min(1).max(5).default(3),
        escalation_rate_bps: z.number().int().min(0).max(10000).default(1000), // Integer basis points
        decay_rate_bps: z.number().int().min(0).max(10000).default(500),
    })
    .strict()

export const GrievanceMachineRailSchema = z
    .object({
        id: z.string().regex(/^grv_[a-z0-9_]+$/),
        name: z.string().min(1),
        category: GrievanceCategoryEnum,
        version: z.number().int().min(1).default(1),
        participants_primary: z.tuple([
            z.string().regex(/^char_[a-z0-9_]+$/),
            z.string().regex(/^char_[a-z0-9_]+$/),
        ]),
        intensity: IntensityEnvelopeSchema,
        cooldown_cycles: z.number().int().min(0).default(2),
        spawns_on_max_escalation: z
            .array(z.string().regex(/^grv_[a-z0-9_]+$/))
            .default([]),
        bound_props: z.array(z.string().regex(/^item_[a-z0-9_]+$/)).default([]),
        tonal_override_eligible: z.boolean().default(false),
        created_at_epoch: z.number().int().default(0),
        updated_at_epoch: z.number().int().default(0),
    })
    .strict()
    .refine(
        (data) => data.participants_primary[0] !== data.participants_primary[1],
        {
            message:
                'REFLEXIVE_DISPUTE_PROHIBITED: An entity cannot maintain a primary grievance against itself.',
            path: ['participants_primary'],
        },
    )
    .refine(
        (data) => {
            if (data.tonal_override_eligible) {
                return (
                    data.intensity.max_intensity <= 2 &&
                    data.spawns_on_max_escalation.length === 0
                )
            }
            return true
        },
        {
            message:
                'FARCE_CONTRACT_BREACH: Farce disputes must have max_intensity <= 2 and zero child spawns.',
            path: ['tonal_override_eligible'],
        },
    )

export type GrievanceMachineRail = z.infer<typeof GrievanceMachineRailSchema>
