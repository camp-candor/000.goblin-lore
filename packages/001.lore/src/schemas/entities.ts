import { z } from 'zod'

/**
 * ---------------------------------------------------------------------------
 * 1. SOMATIC VECTOR (Physical Capability & Kinematic Constraints)
 * ---------------------------------------------------------------------------
 */
export const LocomotionBaselineEnum = z.enum([
    'bipedal_standard',
    'bipedal_hunched',
    'quadrupedal',
    'slithering',
    'brachiation',
    'sessile',
    'limping',
    'neuropathy_shuffle',
    'heavy_grounded_slog',
])
export type LocomotionBaseline = z.infer<typeof LocomotionBaselineEnum>

export const SomaticVectorSchema = z
    .object({
        // 32-bit integer bitmask representing motor capabilities
        somatic_capability_mask: z.number().int().default(0xffffffff),
        // Explicit functional upper limbs available for equipping / task execution
        available_arms: z.number().int().min(0).max(4).default(2),
        locomotion_baseline: LocomotionBaselineEnum.default('bipedal_standard'),
        // Negative motor exclusion list: compile-time blacklisted verbs
        banned_kinetic_verbs: z.array(z.string().min(1)).default([]),
        // Active anatomical traumas / pathologies (e.g., 'severed_left_arm', 'paralyzed_arm')
        conditions: z.array(z.string().min(1)).default([]),
        motor_limitations: z.array(z.string().min(1)).default([]),
        signature_tics: z.array(z.string().min(1)).default([]),
    })
    .strict()
export type SomaticVector = z.infer<typeof SomaticVectorSchema>

/**
 * ---------------------------------------------------------------------------
 * 2. LOGISTICAL VECTOR (Conservation of Mass & Equipment Hierarchies)
 * ---------------------------------------------------------------------------
 */
export const WeightClassEnum = z.enum([
    'negligible',
    'light',
    'medium',
    'heavy',
    'encumbering',
])
export type WeightClass = z.infer<typeof WeightClassEnum>

export const CharacterLogisticalVectorSchema = z
    .object({
        // Items permanently worn on body
        worn: z.array(z.string().min(1)).default([]),
        // Items held actively in hands (governed by available_arms)
        held: z.array(z.string().min(1)).default([]),
        // Items slung or carried in packs
        carried: z.array(z.string().min(1)).default([]),
        // Items stored in off-site spatial caches
        cached: z.array(z.string().min(1)).default([]),
    })
    .strict()
export type CharacterLogisticalVector = z.infer<
    typeof CharacterLogisticalVectorSchema
>

export const PossessionLogisticalVectorSchema = z
    .object({
        is_contested: z.boolean().default(false),
        weight_class: WeightClassEnum.default('light'),
        // Integer hands required to wield/carry (1 or 2)
        occupies_hands: z.number().int().min(0).max(2).default(1),
        // Mass in grams (integer basis)
        mass_grams: z.number().int().nonnegative().default(0),
    })
    .strict()
export type PossessionLogisticalVector = z.infer<
    typeof PossessionLogisticalVectorSchema
>

/**
 * ---------------------------------------------------------------------------
 * 3. EPISTEMIC & RELATIONAL VECTOR (Information Horizons & Debts)
 * ---------------------------------------------------------------------------
 */
export const EscalationCeilingSchema = z.number().int().min(1).max(5)
export type EscalationCeiling = z.infer<typeof EscalationCeilingSchema>

export const EpistemicVectorSchema = z
    .object({
        // Dramatic escalation threshold (1-5)
        escalation_ceiling: EscalationCeilingSchema.default(3),
        // Directional social debt strings: "target_char_id" -> integer count
        leverage_strings: z
            .record(z.string(), z.number().int().nonnegative())
            .default({}),
        // Relational stance presets: "target_char_id" -> role / stance
        relationship_defaults: z.record(z.string(), z.string()).default({}),
        // Character IDs this entity holds leverage over
        strings_held_over: z.array(z.string().min(1)).default([]),
        // Known secret identifiers (Ignorance-by-Omission tracking)
        known_secret_ids: z.array(z.string().min(1)).default([]),
        // Banned subtext attenuation tokens
        banned_attenuation_tokens: z.array(z.string().min(1)).default([]),
    })
    .strict()
export type EpistemicVector = z.infer<typeof EpistemicVectorSchema>

/**
 * ---------------------------------------------------------------------------
 * 4. DUAL-RAIL ENTITY SCHEMAS
 * ---------------------------------------------------------------------------
 */
export const BaseEntitySchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    type: z.enum(['character', 'possession', 'grievance', 'location', 'world']),
    status: z
        .enum(['active', 'retired', 'departed', 'dormant'])
        .default('active'),
    historical_reference: z.boolean().default(false),
    retirement_reason: z.string().optional(),
})

export const CharacterSchema = BaseEntitySchema.extend({
    type: z.literal('character'),
    id: z
        .string()
        .regex(/^char_[a-z0-9_]+$/, 'Character ID must follow format char_*'),
    faction_id: z.string().optional(),
    location: z.string().min(1).optional(),
    somatic: SomaticVectorSchema,
    logistical: CharacterLogisticalVectorSchema,
    epistemic: EpistemicVectorSchema,
    linked_grievances: z.array(z.string().min(1)).default([]),
    linked_possessions: z.array(z.string().min(1)).default([]),
}).strict()
export type Character = z.infer<typeof CharacterSchema>

export const PossessionSchema = BaseEntitySchema.extend({
    type: z.literal('possession'),
    id: z
        .string()
        .regex(/^item_[a-z0-9_]+$/, 'Possession ID must follow format item_*'),
    location: z.string().min(1).optional(),
    owner: z.string().min(1).optional(),
    contested_by: z.array(z.string().min(1)).default([]),
    logistical: PossessionLogisticalVectorSchema,
}).strict()
export type Possession = z.infer<typeof PossessionSchema>

export const LocationSchema = BaseEntitySchema.extend({
    type: z.literal('location'),
    id: z
        .string()
        .regex(/^loc_[a-z0-9_]+$/, 'Location ID must follow format loc_*'),
    acoustic_damping_bp: z.number().int().min(0).max(10000).default(1500),
    lighting_level: z
        .enum(['dark', 'dim', 'standard', 'bright', 'strobe'])
        .default('dim'),
    connected_locations: z.array(z.string().min(1)).default([]),
    linked_grievances: z.array(z.string().min(1)).default([]),
    linked_possessions: z.array(z.string().min(1)).default([]),
    participants: z.array(z.string().min(1)).default([]),
}).strict()
export type Location = z.infer<typeof LocationSchema>

export const RefusalVectorSchema = z
    .object({
        rule_id: z.string().regex(/^rule_[a-z0-9_]+$/),
        character_id: z.string().regex(/^char_[a-z0-9_]+$/),
        trigger_condition: z.string().min(5).max(250),
        mandatory_refusal: z.string().min(5).max(250),
        unavoidable_cost: z.string().min(5).max(250),
    })
    .strict()
export type RefusalVector = z.infer<typeof RefusalVectorSchema>
