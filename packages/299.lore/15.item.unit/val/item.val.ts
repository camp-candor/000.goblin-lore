import { z } from 'zod'
import {
    WeightClassSchema,
    EquipSlotSchema,
    OccupiesHandsSchema,
} from '../../12.gear.unit/val/gear.val.js'

export const ItemIdentifierSchema = z
    .string()
    .regex(/^item_[a-z0-9_]+$/, 'Item ID must match regex ^item_[a-z0-9_]+$')

export const PossessionFrontmatterSchema = z
    .object({
        id: ItemIdentifierSchema,
        type: z.literal('possession'),
        name: z.string().min(1, 'Item name is required'),
        mass_grams: z
            .number()
            .int()
            .min(1, 'Item mass must be a positive integer in grams')
            .max(1000000, 'Item mass ceiling is 1,000,000 grams'),
        weight_class: WeightClassSchema,
        equip_slot: EquipSlotSchema,
        occupies_hands: OccupiesHandsSchema,
        custody_holder: z
            .string()
            .regex(
                /^(char|loc)_[a-z0-9_]+$/,
                'Custody holder must be a valid char_* or loc_* ID',
            ),
        created_epoch: z.number().int().min(0).default(0),
        last_updated_epoch: z.number().int().min(0).default(0),
    })
    .strict()

export type PossessionFrontmatter = z.infer<typeof PossessionFrontmatterSchema>
