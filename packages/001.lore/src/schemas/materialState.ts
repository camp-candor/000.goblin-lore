import { z } from 'zod'

// ---------------------------------------------------------------------------
// 1. Material Taxonomies & Classifications
// ---------------------------------------------------------------------------
export const MaterialClassEnum = z.enum([
    'METALLIC',
    'ORGANIC_WOOD',
    'TEXTILE',
    'GLASS_CERAMIC',
    'STONE',
    'CHEMICAL_LIQUID',
])

export type MaterialClass = z.infer<typeof MaterialClassEnum>

export const CombustibilityTierEnum = z.enum([
    'IMMUNE',
    'IGNITABLE',
    'HIGHLY_VOLATILE',
])

export type CombustibilityTier = z.infer<typeof CombustibilityTierEnum>

// ---------------------------------------------------------------------------
// 2. Material State Vector Schema
// ---------------------------------------------------------------------------
export const MaterialStateVectorSchema = z
    .object({
        item_id: z.string().regex(/^item_[a-z0-9_]+$/),
        material_class: MaterialClassEnum,
        wetness_bps: z.number().int().min(0).max(10000).default(0), // 10000 = completely submerged
        corrosion_bps: z.number().int().min(0).max(10000).default(0), // 10000 = oxidized/rusted solid
        structural_integrity_bps: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .default(10000), // 0 = completely shattered/destroyed
        damage_threshold_bps: z.number().int().min(0).max(10000).default(500), // Impacts below DT cause 0 damage
        combustibility_tier: CombustibilityTierEnum.default('IMMUNE'),
        is_operable: z.boolean().default(true),
        updated_at_epoch: z.number().int().min(0).default(0),
    })
    .strict()
    .refine(
        (data) => {
            // Invariant: Wetness > 3000 bps renders items IMMUNE to open combustion
            if (
                data.wetness_bps > 3000 &&
                data.combustibility_tier !== 'IMMUNE'
            ) {
                return false
            }
            return true
        },
        {
            message:
                "WETNESS_COMBUSTION_INVARIANT_BREACH: Items with wetness > 3000 bps must have combustibility_tier = 'IMMUNE'.",
            path: ['combustibility_tier'],
        },
    )
    .refine(
        (data) => {
            // Invariant: Zero structural integrity mandates inoperability
            if (data.structural_integrity_bps === 0 && data.is_operable) {
                return false
            }
            return true
        },
        {
            message:
                'ZERO_INTEGRITY_INOPERABLE_BREACH: Items with structural_integrity_bps = 0 cannot be operable.',
            path: ['is_operable'],
        },
    )

export type MaterialStateVector = z.infer<typeof MaterialStateVectorSchema>

// ---------------------------------------------------------------------------
// 3. Operation Proposal Schema
// ---------------------------------------------------------------------------
export const AttemptedOperationSchema = z
    .object({
        actor_id: z.string().regex(/^char_[a-z0-9_]+$/),
        item_id: z.string().regex(/^item_[a-z0-9_]+$/),
        operation_type: z.enum([
            'OPERATE_MECHANISM',
            'IGNITE',
            'STRIKE_IMPACT',
            'PRY_LEVERAGE',
        ]),
        applied_energy_bps: z.number().int().min(0).max(10000).default(1000),
    })
    .strict()

export type AttemptedOperation = z.infer<typeof AttemptedOperationSchema>
