import { z } from 'zod'
import {
    CharacterIdSchema,
    GrievanceIdSchema,
} from '../../38.types.unit/fce/ident.schema'
import { BasisPointsSchema } from '../../38.types.unit/fce/primitives.schema'

export const GrievanceCategoryEnum = z.enum([
    'RESOURCE_HOARDING',
    'STATUS_ANXIETY',
    'SECRET_KEEPING',
    'TERRITORIAL_INTRUSION',
    'GENERATIONAL_SACRIFICE',
])
export type GrievanceCategory = z.infer<typeof GrievanceCategoryEnum>

export const GrievanceOutcomeDescriptorSchema = z
    .object({
        mechanics: z.string().min(5),
        somatic_cost_bp: BasisPointsSchema.default(0),
        strings_transferred: z.number().int().default(0),
    })
    .strict()
export type GrievanceOutcomeDescriptor = z.infer<
    typeof GrievanceOutcomeDescriptorSchema
>

export const GrievanceSpawnTargetSchema = z
    .object({
        type: z.literal('grievance'),
        target_id: GrievanceIdSchema,
    })
    .strict()
export type GrievanceSpawnTarget = z.infer<typeof GrievanceSpawnTargetSchema>

export const GrievanceSchema = z
    .object({
        id: GrievanceIdSchema,
        title: z.string().min(1),
        category: GrievanceCategoryEnum,
        participants_primary: z
            .array(CharacterIdSchema)
            .min(2, 'Dyadic grievance requires exactly 2 primary participants')
            .max(2, 'Dyadic grievance requires exactly 2 primary participants'),
        intensity_bp: BasisPointsSchema.default(2000),
        escalation_ceiling_bp: BasisPointsSchema.default(8000),
        cooldown_ticks: z.number().int().nonnegative().default(3),
        spawns_on_max_escalation: z
            .array(GrievanceSpawnTargetSchema)
            .default([]),
        outcomes: z
            .object({
                clean_win: GrievanceOutcomeDescriptorSchema,
                costly_win: GrievanceOutcomeDescriptorSchema,
                mutual_wound: GrievanceOutcomeDescriptorSchema,
                backfire: GrievanceOutcomeDescriptorSchema,
            })
            .strict(),
    })
    .strict()

export type Grievance = z.infer<typeof GrievanceSchema>
