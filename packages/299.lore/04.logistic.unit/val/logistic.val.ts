import { z } from 'zod'

export const WeightClassEnum = z.enum([
    'negligible',
    'scrap',
    'shine',
    'weight',
    'bulk',
    'encumbering',
])
export type WeightClass = z.infer<typeof WeightClassEnum>

export const EquipSlotTypeEnum = z.enum([
    'WORN_INNER',
    'WORN_OUTER',
    'HELD_PRIMARY',
    'HELD_OFFHAND',
    'SLUNG_SHOULDER',
    'POCKET_STORAGE',
    'VEHICLE_BED',
    'CACHED_LOCATION',
])
export type EquipSlotType = z.infer<typeof EquipSlotTypeEnum>

export const AnatomicalEquipPartitionEnum = z.enum([
    'worn',
    'held',
    'carried',
    'cached',
])
export type AnatomicalEquipPartition = z.infer<
    typeof AnatomicalEquipPartitionEnum
>

export const CharacterIdSchema = z.string().regex(/^char_[a-z0-9_]+$/, {
    message: '[LOGISTIC_SCHEMA_BREACH] entity_id must match ^char_[a-z0-9_]+$',
})

export const ItemIdSchema = z.string().regex(/^item_[a-z0-9_]+$/, {
    message: '[LOGISTIC_SCHEMA_BREACH] item_id must match ^item_[a-z0-9_]+$',
})

export const LocationIdSchema = z.string().regex(/^loc_[a-z0-9_]+$/, {
    message: '[LOGISTIC_SCHEMA_BREACH] location_id must match ^loc_[a-z0-9_]+$',
})

export const CharacterLogisticalVectorSchema = z
    .object({
        entity_id: CharacterIdSchema,
        worn: z.array(ItemIdSchema).max(4, {
            message:
                '[PARTITION_CEILING_BREACH] worn partition cannot exceed 4 items',
        }),
        held: z.array(ItemIdSchema).max(2, {
            message:
                '[PARTITION_CEILING_BREACH] held partition cannot exceed 2 items',
        }),
        carried: z.array(ItemIdSchema).max(4, {
            message:
                '[PARTITION_CEILING_BREACH] carried partition cannot exceed 4 items',
        }),
        cached: z.record(LocationIdSchema, z.array(ItemIdSchema)),
    })
    .strict()

export type CharacterLogisticalVector = z.infer<
    typeof CharacterLogisticalVectorSchema
>

export const PossessionLogisticalVectorSchema = z
    .object({
        item_id: ItemIdSchema,
        occupies_hands: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] occupies_hands must be an integer',
            })
            .min(0)
            .max(2),
        occupies_hands_bps: z
            .number()
            .int({
                message:
                    '[FLOAT_PROHIBITED] occupies_hands_bps must be an integer',
            })
            .min(0)
            .max(20000),
        mass_grams: z
            .number()
            .int({
                message: '[FLOAT_PROHIBITED] mass_grams must be an integer',
            })
            .min(1, {
                message: '[OUT_OF_BOUNDS] mass_grams must be at least 1 gram',
            }),
        weight_class: WeightClassEnum,
        is_contested: z.boolean().default(false),
        allowed_slots: z.array(EquipSlotTypeEnum).min(1),
        owner_id: z.union([CharacterIdSchema, z.null()]).optional(),
        location_id: z.union([LocationIdSchema, z.null()]).optional(),
    })
    .strict()

export type PossessionLogisticalVector = z.infer<
    typeof PossessionLogisticalVectorSchema
>
