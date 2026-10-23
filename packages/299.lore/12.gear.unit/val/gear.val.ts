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
export const PossessionDossierFrontmatterSchema = z
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
export type PossessionDossierFrontmatter = z.infer<
    typeof PossessionDossierFrontmatterSchema
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
