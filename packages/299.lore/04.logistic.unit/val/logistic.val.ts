import { z } from 'zod'

/**
 * Weight class taxonomy for physical possessions.
 * Used for mechanical encumbrance calculations and movement drag.
 */
export const WeightClassEnum = z.enum([
    'negligible',
    'scrap',
    'shine',
    'weight',
    'bulk',
    'encumbering',
])
export type WeightClass = z.infer<typeof WeightClassEnum>

/**
 * Concrete equip slot positions across anatomy and environment.
 */
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

/**
 * The 4-Tier Anatomical & Spatial Partition.
 */
export const AnatomicalEquipPartitionEnum = z.enum([
    'worn',
    'held',
    'carried',
    'cached',
])
export type AnatomicalEquipPartition = z.infer<
    typeof AnatomicalEquipPartitionEnum
>

/**
 * Identifier schemas conforming to 7-bit ASCII lowercase conventions.
 */
export const ItemIdSchema = z.string().regex(/^item_[a-z0-9_]+$/, {
    message: 'Item ID must match ^item_[a-z0-9_]+$',
})

export const LocationIdSchema = z.string().regex(/^loc_[a-z0-9_]+$/, {
    message: 'Location ID must match ^loc_[a-z0-9_]+$',
})

export const CharacterIdSchema = z.string().regex(/^char_[a-z0-9_]+$/, {
    message: 'Character ID must match ^char_[a-z0-9_]+$',
})

/**
 * CharacterLogisticalVectorSchema
 * The 4-Tier Equipment Slot Allocator Schema for character dossiers and state.
 */
export const CharacterLogisticalVectorSchema = z
    .object({
        entity_id: CharacterIdSchema,
        worn: z
            .array(ItemIdSchema)
            .max(4, { message: 'Worn items cannot exceed 4 anatomical slots' })
            .default([]),
        held: z
            .array(ItemIdSchema)
            .max(2, { message: 'Held items cannot exceed 2 active hands' })
            .default([]),
        carried: z
            .array(ItemIdSchema)
            .max(4, {
                message: 'Carried items cannot exceed 4 slung/pocket slots',
            })
            .default([]),
        cached: z.record(LocationIdSchema, z.array(ItemIdSchema)).default({}),
    })
    .strict()
export type CharacterLogisticalVector = z.infer<
    typeof CharacterLogisticalVectorSchema
>

/**
 * PossessionLogisticalVectorSchema
 * Metadata contract required for any tracked physical prop.
 */
export const PossessionLogisticalVectorSchema = z
    .object({
        item_id: ItemIdSchema,
        occupies_hands: z.number().int().min(0).max(2).default(1),
        occupies_hands_bps: z.number().int().min(0).max(20000).default(10000),
        mass_grams: z.number().int().nonnegative().default(100),
        weight_class: WeightClassEnum.default('scrap'),
        is_contested: z.boolean().default(false),
        allowed_slots: z
            .array(EquipSlotTypeEnum)
            .min(1, {
                message: 'Item must be assignable to at least one equip slot',
            })
            .default(['HELD_PRIMARY', 'HELD_OFFHAND', 'CACHED_LOCATION']),
    })
    .strict()
export type PossessionLogisticalVector = z.infer<
    typeof PossessionLogisticalVectorSchema
>

/**
 * Hand Capacity Invariant Pre-Flight Evaluation Input Schema.
 */
export const HandCapacityEvaluationInputSchema = z
    .object({
        entity_id: CharacterIdSchema,
        arms_available_bps: z.number().int().min(0).max(20000),
        held_items: z.array(PossessionLogisticalVectorSchema),
    })
    .strict()
export type HandCapacityEvaluationInput = z.infer<
    typeof HandCapacityEvaluationInputSchema
>
