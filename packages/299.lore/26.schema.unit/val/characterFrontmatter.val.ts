import { z } from 'zod'
import { BasisPointSchema } from '../../35.threshold.unit/val/threshold.val.js'

/**
 * 7-bit ASCII string validation enforcing pure POSIX terminal compatibility.
 */
export const AsciiStringSchema = z
    .string()
    .regex(/^[\x20-\x7E]*$/, 'STRING_NOT_7BIT_ASCII')

export const CharacterIdentifierSchema = z
    .string()
    .regex(
        /^char_[a-z0-9_]+$/,
        'Character ID must match regex ^char_[a-z0-9_]+$',
    )

/**
 * Locomotion baseline enum defining foundational physiological movement capability.
 */
export const LocomotionBaselineSchema = z.enum([
    'bipedal_standard',
    'bipedal_hunched',
    'limping',
    'quadrupedal',
    'slithering',
    'brachiation',
    'sessile',
    'heavy_grounded_slog',
])
export const LocomotionBaselineEnum = LocomotionBaselineSchema
export type LocomotionBaseline = z.infer<typeof LocomotionBaselineSchema>

/**
 * Comedic Register Enum guarding against model tone regression.
 */
export const ComedicRegisterEnum = z.enum([
    'deadpan',
    'self_serious',
    'oblivious',
    'hyper_literal',
    'aggrieved_bureaucrat',
    'clinical_gravel',
    'defensive_deflector',
])
export type ComedicRegister = z.infer<typeof ComedicRegisterEnum>

/**
 * Sensory acuity configuration using integer basis points.
 */
export const SensoryAcuitySchema = z
    .object({
        optical_state: z
            .enum(['NORMAL', 'MONOCULAR', 'BLIND'])
            .default('NORMAL'),
        blind_cone_degrees: z.number().int().min(0).max(360).default(0),
        auditory_floor_debuff_cdb: z
            .number()
            .int()
            .min(0)
            .max(10000)
            .default(0),
    })
    .strict()
    .superRefine((data, ctx) => {
        if (
            data.optical_state === 'MONOCULAR' &&
            data.blind_cone_degrees < 60
        ) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'MONOCULAR vision requires blind_cone_degrees >= 60',
                path: ['blind_cone_degrees'],
            })
        }
    })

/**
 * Vocal DSP Modifier schema using integer basis points and centitones.
 */
export const VocalDspModifierSchema = z
    .object({
        pitch_shift_centitones: z
            .number()
            .int()
            .min(-1200)
            .max(1200)
            .default(0),
        speed_multiplier_bps: z
            .number()
            .int()
            .min(5000)
            .max(20000)
            .default(10000), // 10000 = 1.0x
        pause_frequency_bps: z
            .number()
            .int()
            .min(5000)
            .max(30000)
            .default(10000),
    })
    .strict()

export const FoundationalSomaticVectorSchema = z
    .object({
        arms_available_bp: BasisPointSchema,
        locomotion_baseline: LocomotionBaselineSchema,
        motor_limitations: z.array(z.string().min(1)).default([]),
        banned_kinetic_verbs: z.array(z.string().min(1)).default([]),
    })
    .strict()

export const CanonicalSomaticVectorSchema = z
    .object({
        locomotion_baseline: LocomotionBaselineSchema,
        available_arms_bps: z.number().int().min(0).max(20000).default(20000),
        banned_kinetic_verbs: z
            .array(z.string().regex(/^[a-z_]+$/))
            .default([]),
        conditions: z.array(z.string().regex(/^cnd_[a-z0-9_]+$/)).default([]),
        motor_limitations: z.array(z.string().regex(/^[A-Z_]+$/)).default([]),
        signature_tics: z.array(AsciiStringSchema).default([]),
        sensory: SensoryAcuitySchema.default({}),
        vocal_dsp: VocalDspModifierSchema.default({}),
    })
    .strict()

export const SomaticVectorSchema = z.union([
    FoundationalSomaticVectorSchema,
    CanonicalSomaticVectorSchema,
])

export const FoundationalLogisticalVectorSchema = z
    .object({
        max_mass_grams: z
            .number()
            .int()
            .min(0, 'Mass must be non-negative integer grams'),
        worn_slots: z.array(z.string().min(1)).default([]),
        carried_inventory: z
            .array(z.string().regex(/^item_[a-z0-9_]+$/))
            .default([]),
    })
    .strict()

export const CanonicalLogisticalVectorSchema = z
    .object({
        worn: z
            .array(z.string().regex(/^item_[a-z0-9_]+$/))
            .max(4)
            .default([]),
        held: z
            .array(z.string().regex(/^item_[a-z0-9_]+$/))
            .max(2)
            .default([]),
        carried: z
            .array(z.string().regex(/^item_[a-z0-9_]+$/))
            .max(4)
            .default([]),
        cached: z
            .record(
                z.string().regex(/^loc_[a-z0-9_]+$/),
                z.array(z.string().regex(/^item_[a-z0-9_]+$/)),
            )
            .default({}),
    })
    .strict()

export const LogisticalVectorSchema = z.union([
    FoundationalLogisticalVectorSchema,
    CanonicalLogisticalVectorSchema,
])

export const FoundationalEpistemicVectorSchema = z
    .object({
        active_strings_held: z.array(z.string().min(1)).default([]),
        conversation_refusal_triggers: z.array(z.string().min(1)).default([]),
        forbidden_disclosure_tokens: z.array(z.string().min(1)).default([]),
    })
    .strict()

export const CanonicalEpistemicVectorSchema = z
    .object({
        escalation_ceiling: z.number().int().min(1).max(5).default(3),
        strings_held_over: z
            .array(z.string().regex(/^char_[a-z0-9_]+$/))
            .default([]),
        leverage_strings: z
            .record(
                z.string().regex(/^char_[a-z0-9_]+$/),
                z.number().int().min(0).max(10),
            )
            .default({}),
        relationship_defaults: z
            .record(z.string().regex(/^char_[a-z0-9_]+$/), AsciiStringSchema)
            .default({}),
        attenuation_tokens: z.array(AsciiStringSchema).default([]),
    })
    .strict()

export const EpistemicVectorSchema = z.union([
    FoundationalEpistemicVectorSchema,
    CanonicalEpistemicVectorSchema,
])

/**
 * Refusal Vector Rule Schema (Three-Stage Refusal Triad).
 */
export const RefusalVectorRuleSchema = z
    .object({
        refusal_id: z.string().regex(/^ref_[a-z0-9_]+$/),
        trigger: AsciiStringSchema.min(1),
        mandatory_refusal: AsciiStringSchema.min(1),
        unavoidable_cost: AsciiStringSchema.min(1),
        strain_threshold_bps: z
            .number()
            .int()
            .min(1000)
            .max(10000)
            .default(8000),
        post_break_state: AsciiStringSchema.min(1),
        discovery_provenance_sha256: z
            .string()
            .regex(/^[a-f0-9]{64}$/)
            .optional(),
        discovery_take_id: AsciiStringSchema.optional(),
    })
    .strict()

/**
 * Character Risk Profile Schema.
 */
export const CharacterRiskProfileSchema = z
    .object({
        disposition: z.enum([
            'CAUTIOUS',
            'OPPORTUNISTIC',
            'RECKLESS',
            'PARANOID_FREEZE',
        ]),
        trigger_condition: AsciiStringSchema.min(1),
        failure_behavior: AsciiStringSchema.min(1),
        shares_pose_with: z
            .string()
            .regex(/^char_[a-z0-9_]+$/)
            .nullable()
            .default(null),
    })
    .strict()

export const FoundationalCharacterFrontmatterSchema = z
    .object({
        id: CharacterIdentifierSchema,
        type: z.literal('character'),
        name: z.string().min(1, 'Character display name is required'),
        status: z.enum(['active', 'departed', 'dormant']).default('active'),
        somatic: FoundationalSomaticVectorSchema,
        logistical: FoundationalLogisticalVectorSchema,
        epistemic: FoundationalEpistemicVectorSchema,
        created_epoch: z.number().int().min(0).default(0),
        last_updated_epoch: z.number().int().min(0).default(0),
    })
    .strict()

export const CanonicalCharacterFrontmatterSchema = z
    .object({
        id: CharacterIdentifierSchema,
        name: AsciiStringSchema.min(1, 'NAME_REQUIRED'),
        type: z.literal('character'),
        status: z
            .enum(['active', 'departed', 'dormant', 'DEPRECATED_ARCHIVED'])
            .default('active'),
        archetype_id: z
            .string()
            .regex(/^arch_[a-z0-9_]+$/)
            .optional(),
        somatic: CanonicalSomaticVectorSchema,
        logistical: CanonicalLogisticalVectorSchema.default({}),
        epistemic: CanonicalEpistemicVectorSchema.default({}),
        refusal_vectors: z.array(RefusalVectorRuleSchema).default([]),
        comedic_register: ComedicRegisterEnum.default('deadpan'),
        risk_profile: CharacterRiskProfileSchema.optional(),
        pending_showrunner_task: z.string().nullable().default(null),
        emotion_visual_mapping: z
            .record(z.string(), z.string().nullable())
            .default({}),
        created_at_epoch: z.number().int().nonnegative().default(0),
        staged_location_id: z.string().optional(),
        inventory: z
            .object({
                held_primary: z.string().optional(),
                held_secondary: z.string().optional(),
                worn: z.array(z.string()).optional(),
            })
            .passthrough()
            .optional(),
    })
    .strict()

/**
 * Master Character Frontmatter Schema.
 */
export const CharacterFrontmatterSchema = z.union([
    FoundationalCharacterFrontmatterSchema,
    CanonicalCharacterFrontmatterSchema,
])

export type CharacterFrontmatter = z.infer<typeof CharacterFrontmatterSchema>
