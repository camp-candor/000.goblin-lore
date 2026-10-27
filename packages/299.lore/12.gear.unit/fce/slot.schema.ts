import { z } from 'zod'
import { PossessionIdSchema } from '../../38.types.unit/fce/ident.schema.js'

export const EquipSlotTypeEnum = z.enum([
    'WORN_INNER',
    'WORN_OUTER',
    'HELD_PRIMARY',
    'HELD_OFFHAND',
    'SLUNG_SHOULDER',
    'POCKET_STORAGE',
    'CACHED_ROOM',
])
export type EquipSlotType = z.infer<typeof EquipSlotTypeEnum>

export const EquipSlotSchema = z
    .object({
        slot_type: EquipSlotTypeEnum,
        item_id: PossessionIdSchema.nullable(),
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
            .default(0),
    })
    .strict()
export type EquipSlot = z.infer<typeof EquipSlotSchema>

export const CharacterLogisticalVectorSchema = z
    .object({
        worn: z
            .record(
                z.enum(['head', 'chest', 'belt', 'feet']),
                PossessionIdSchema,
            )
            .default({}),
        held_primary: PossessionIdSchema.nullable().default(null),
        held_secondary: PossessionIdSchema.nullable().default(null),
        carried: z.array(PossessionIdSchema).max(4).default([]),
        cached: z.array(PossessionIdSchema).default([]),
        max_carry_mass_g: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] max_carry_mass_g must be an integer',
            })
            .positive({
                message: '[OUT_OF_BOUNDS] max_carry_mass_g must be positive',
            })
            .default(5000),
    })
    .strict()
export type CharacterLogisticalVector = z.infer<
    typeof CharacterLogisticalVectorSchema
>
