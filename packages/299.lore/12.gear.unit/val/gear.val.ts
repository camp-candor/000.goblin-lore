import { z } from 'zod'

/**
 * 7-bit ASCII Slug Regular Expressions.
 */
export const ItemSlugRegex = /^item_[a-z0-9_]+$/
export const CharacterSlugRegex = /^char_[a-z0-9_]+$/
export const LocationSlugRegex = /^loc_[a-z0-9_]+$/
export const GrievanceSlugRegex = /^grv_[a-z0-9_]+$/

/**
 * Canonical Weight Classification Enum.
 */
export const GearWeightClassEnum = z.enum([
    'negligible',
    'scrap',
    'shine',
    'weight',
    'bulk',
    'encumbering',
])
export type GearWeightClass = z.infer<typeof GearWeightClassEnum>

/**
 * Frontmatter schema for parsed possessions/*.md files on local disk.
 */
export const CanonicalPossessionDossierFrontmatterSchema = z
    .object({
        id: z.string().regex(ItemSlugRegex, {
            message: 'Item ID must match ^item_[a-z0-9_]+$',
        }),
        name: z.string().min(1),
        type: z.literal('possession'),
        owner: z.string().regex(CharacterSlugRegex).optional(),
        location_id: z.string().regex(LocationSlugRegex).optional(),
        logistical: z
            .object({
                weight_class: GearWeightClassEnum.default('scrap'),
                mass_grams: z.number().int().nonnegative().default(100),
                occupies_hands: z.number().int().min(0).max(2).default(1),
                occupies_hands_bps: z
                    .number()
                    .int()
                    .min(0)
                    .max(20000)
                    .default(10000),
                is_contested: z.boolean().default(false),
                contested_by: z
                    .array(z.string().regex(CharacterSlugRegex))
                    .default([]),
                linked_grievances: z
                    .array(z.string().regex(GrievanceSlugRegex))
                    .default([]),
            })
            .strict(),
        created_at_epoch: z.number().int().nonnegative().default(0),
    })
    .strict()
    .refine((data) => Boolean(data.owner || data.location_id), {
        message:
            'UNGROUNDED_POSSESSION_BREACH: Item must declare either an owner or location_id',
        path: ['owner'],
    })

export const GenesisPossessionDossierFrontmatterSchema = z
    .object({
        id: z.string().regex(ItemSlugRegex, {
            message: 'Item ID must match ^item_[a-z0-9_]+$',
        }),
        name: z.string().min(1),
        mass_grams: z.number().int().nonnegative(),
        weight_class: GearWeightClassEnum,
        slot_category: z.string().optional(),
        hands_required_bps: z.number().int().min(0).max(20000),
        custody_holder: z.string().regex(CharacterSlugRegex),
        material: z.string().optional(),
        tags: z.array(z.string()).optional(),
    })
    .passthrough()

export const PossessionDossierFrontmatterSchema = z.union([
    CanonicalPossessionDossierFrontmatterSchema,
    GenesisPossessionDossierFrontmatterSchema,
])
export type PossessionDossierFrontmatter = z.infer<
    typeof PossessionDossierFrontmatterSchema
>
export type CanonicalPossessionDossierFrontmatter = z.infer<
    typeof CanonicalPossessionDossierFrontmatterSchema
>
export type GenesisPossessionDossierFrontmatter = z.infer<
    typeof GenesisPossessionDossierFrontmatterSchema
>

/**
 * Resolution query input payload for auditing character logistical arrays.
 */
export const ResolveGearPointersInputSchema = z
    .object({
        series_slug: z.string().min(1),
        character_id: z.string().regex(CharacterSlugRegex),
        character_name: z.string().min(1),
        is_retired: z.boolean().default(false),
        logistical_slots: z
            .object({
                worn: z.array(z.string().regex(ItemSlugRegex)).default([]),
                held: z.array(z.string().regex(ItemSlugRegex)).default([]),
                carried: z.array(z.string().regex(ItemSlugRegex)).default([]),
                cached: z
                    .record(
                        z.string().regex(LocationSlugRegex),
                        z.array(z.string().regex(ItemSlugRegex)),
                    )
                    .default({}),
            })
            .strict(),
    })
    .strict()
export type ResolveGearPointersInput = z.infer<
    typeof ResolveGearPointersInputSchema
>

export const WeightClassSchema = z.enum(['scrap', 'shine', 'weight', 'bulk'])
export type WeightClass = z.infer<typeof WeightClassSchema>

export const EquipSlotSchema = z.enum([
    'held_primary',
    'held_offhand',
    'worn',
    'carried',
    'cached',
])
export type EquipSlot = z.infer<typeof EquipSlotSchema>

/**
 * Hand allocation requirement represented in integer basis points:
 * 0 bp = free hands; 10000 bp = 1 full hand; 20000 bp = two-handed carry.
 */
export const OccupiesHandsSchema = z.union([
    z.literal(0),
    z.literal(10000),
    z.literal(20000),
])
export type OccupiesHands = z.infer<typeof OccupiesHandsSchema>
