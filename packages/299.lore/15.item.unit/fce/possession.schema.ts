import { z } from 'zod'
import {
    CharacterIdSchema,
    GrievanceIdSchema,
    PossessionIdSchema,
} from '../../38.types.unit/fce/ident.schema.js'

export const WeightClassEnum = z.enum(['SCRAP', 'SHINE', 'WEIGHT'])
export type WeightClass = z.infer<typeof WeightClassEnum>

export const PossessionSchema = z
    .object({
        schema_version: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] schema_version must be an integer',
            })
            .min(1, { message: '[OUT_OF_BOUNDS] schema_version must be >= 1' })
            .default(1),
        id: PossessionIdSchema,
        name: z.string().min(1),
        owner_id: CharacterIdSchema.nullable().default(null),
        weight_class: WeightClassEnum,
        mass_g: z
            .number()
            .int({ message: '[FLOAT_PROHIBITED] mass_g must be an integer' })
            .nonnegative({
                message: '[OUT_OF_BOUNDS] mass_g cannot be negative',
            })
            .default(100),
        occupies_hands: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] occupies_hands must be an integer',
            })
            .min(0, {
                message: '[OUT_OF_BOUNDS] occupies_hands cannot be negative',
            })
            .max(2, {
                message: '[OUT_OF_BOUNDS] occupies_hands cannot exceed 2',
            })
            .default(1),
        contested_by: z.array(CharacterIdSchema).default([]),
        linked_grievances: z.array(GrievanceIdSchema).default([]),
    })
    .strict()

export type Possession = z.infer<typeof PossessionSchema>
