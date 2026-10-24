import { z } from 'zod'

/**
 * 7-bit ASCII string validation enforcing pure POSIX terminal compatibility.
 */
export const AsciiStringSchema = z
    .string()
    .regex(/^[\x20-\x7E]*$/, 'STRING_NOT_7BIT_ASCII')

/**
 * Locomotion baseline enum defining foundational physiological movement capability.
 */
export const LocomotionBaselineEnum = z.enum([
    'bipedal_standard',
    'bipedal_hunched',
    'quadrupedal',
    'slithering',
    'brachiation',
    'sessile',
    'limping',
    'heavy_grounded_slog',
])
export type LocomotionBaseline = z.infer<typeof LocomotionBaselineEnum>

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

/**
 * Somatic Vector Schema (Biological & Kinematic Limits).
 */
export const SomaticVectorSchema = z
    .object({
        locomotion_baseline: LocomotionBaselineEnum,
        available_arms_bps: z.number().int().min(0).max(20000).default(20000), // 20000 = 2.0 arms
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

/**
 * Logistical Vector Schema (Equipment Slots & Carrying Limits).
 */
export const LogisticalVectorSchema = z
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

/**
 * Epistemic Vector Schema (Information Horizons & Leverage Strings).
 */
export const EpistemicVectorSchema = z
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

/**
 * Master Character Frontmatter Schema (The Machine Rail).
 * Enforces byte-0 parser compliance, exact identifier formats, and structural isolation.
 */
export const CharacterFrontmatterSchema = z
    .object({
        id: z
            .string()
            .regex(/^char_[a-z0-9_]+$/, 'INVALID_CHARACTER_ID_FORMAT'),
        name: AsciiStringSchema.min(1, 'NAME_REQUIRED'),
        type: z.literal('character'),
        status: z
            .enum(['active', 'departed', 'dormant', 'DEPRECATED_ARCHIVED'])
            .default('active'),
        archetype_id: z
            .string()
            .regex(/^arch_[a-z0-9_]+$/)
            .optional(),
        somatic: SomaticVectorSchema,
        logistical: LogisticalVectorSchema.default({}),
        epistemic: EpistemicVectorSchema.default({}),
        refusal_vectors: z.array(RefusalVectorRuleSchema).default([]),
        comedic_register: ComedicRegisterEnum.default('deadpan'),
        risk_profile: CharacterRiskProfileSchema.optional(),
        pending_showrunner_task: z.string().nullable().default(null),
        emotion_visual_mapping: z
            .record(z.string(), z.string().nullable())
            .default({}),
        created_at_epoch: z.number().int().nonnegative().default(0), // Deterministic epoch; rejects ambient clocks
    })
    .strict()

export type CharacterFrontmatter = z.infer<typeof CharacterFrontmatterSchema>
