import { z } from 'zod'

export const GrievanceCategoryEnum = z.enum([
    'resource_hoarding',
    'physical_trauma_blame',
    'status_anxiety',
    'secret_keeping',
    'territorial_infringement',
    'domestic_farce',
])
export type GrievanceCategory = z.infer<typeof GrievanceCategoryEnum>

export const IntensityEnvelopeSchema = z
    .object({
        min: z.number().int().min(1).max(5),
        max: z.number().int().min(1).max(5),
    })
    .refine((data) => data.min <= data.max, {
        message: 'Intensity min must not exceed max',
    })
export type IntensityEnvelope = z.infer<typeof IntensityEnvelopeSchema>

export const GrievanceSchema = z
    .object({
        id: z.string().regex(/^grv_[a-z0-9_]+$/, 'ID must follow format grv_*'),
        title: z.string().min(1),
        category: GrievanceCategoryEnum,
        // Primary disputants: strictly a dyad of 2 distinct character IDs
        participants_primary: z
            .tuple([
                z.string().regex(/^char_[a-z0-9_]+$/),
                z.string().regex(/^char_[a-z0-9_]+$/),
            ])
            .refine(([a, b]) => a !== b, {
                message: 'Primary participants must be two distinct characters',
            }),
        secondary_stakeholders: z
            .array(z.string().regex(/^char_[a-z0-9_]+$/))
            .default([]),
        intensity_envelope: IntensityEnvelopeSchema,
        cooldown_cycles: z.number().int().nonnegative().default(1),
        // DAG child nodes: targeted grievances triggered on maximum escalation
        spawns_on_max_escalation: z
            .array(z.string().regex(/^grv_[a-z0-9_]+$/))
            .default([]),
        tonal_override_eligible: z.boolean().default(false),
        associated_props: z.array(z.string().min(1)).default([]),
        associated_locations: z
            .array(z.string().regex(/^loc_[a-z0-9_]+$/))
            .default([]),
    })
    .strict()

export type Grievance = z.infer<typeof GrievanceSchema>
