import { z } from 'zod'

/**
 * Closed Semantic Verb Family Taxonomy
 * Closed, immutable groupings of action lemmas sharing biomechanical requirements.
 */
export const VERB_FAMILIES = {
    LOCOMOTION_RAPID: [
        'SPRINT',
        'RUN',
        'DASH',
        'BOLT',
        'VAULT',
        'GALLOP',
        'FLEE',
        'BOUND',
        'CHARGE',
        'LEAP',
        'LUNGE',
        'SCRAMBLE',
        'SCURRY',
        'RAPID_STAIRS',
    ],
    LOCOMOTION_VERTICAL: [
        'CLIMB',
        'SCRAMBLE',
        'SCALE',
        'SHINNY',
        'HOIST_SELF',
        'CLIMB_ROPE',
        'CLIMB_LADDER',
    ],
    BIMANUAL_GRIP: [
        'HEAVE',
        'SWING_TWO_HANDED',
        'WRENCH',
        'PRY_BILATERAL',
        'BIMANUAL_LIFT',
        'GRAPPLE_TWO_HANDED',
        'TWO_HANDED_AIM',
        'HOIST',
        'EMBRACE',
        'WIELD_TWO_HANDED',
        'CLIMB',
    ],
    MANIPULATION_FINE: [
        'UNPICK',
        'THREAD',
        'SPLICE',
        'DISARM_MECHANISM',
        'CARVE',
        'PICK_LOCK',
        'THREAD_NEEDLE',
        'CALIBRATE_DIAL',
        'TIE_KNOT',
        'FINE_DISSECTION',
    ],
    VOCAL_DELIVERY: [
        'SHOUT',
        'SCREAM',
        'BELLOW',
        'CHANT',
        'PROJECT_VOICE',
        'SPEAK',
        'WHISPER',
        'WARN_LOUDLY',
    ],
    SUSPICION_AND_AVOIDANCE: [
        'SUSPECT',
        'SNIFF',
        'INSPECT',
        'HESITATE',
        'POUR_OUT',
        'REFUSE_DRINK',
        'SCRUTINIZE',
    ],
} as const

export type VerbFamilyKey = keyof typeof VERB_FAMILIES

/**
 * Feature Roll-Up: Conditions mapping to parent verb families and discrete bans.
 */
export const CONDITION_VERB_ROLLUP: Record<string, readonly string[]> = {
    SEVERED_LEFT_ARM: [...VERB_FAMILIES.BIMANUAL_GRIP],
    SEVERED_RIGHT_ARM: [...VERB_FAMILIES.BIMANUAL_GRIP],
    PARALYZED_LEFT_ARM: [...VERB_FAMILIES.BIMANUAL_GRIP],
    PARALYZED_RIGHT_ARM: [...VERB_FAMILIES.BIMANUAL_GRIP],
    BRACHIAL_PLEXUS_SEVERED: [
        ...VERB_FAMILIES.BIMANUAL_GRIP,
        ...VERB_FAMILIES.MANIPULATION_FINE,
    ],
    AMPUTATED_LIMB: [...VERB_FAMILIES.BIMANUAL_GRIP],
    FRACTURED_FEMUR: [...VERB_FAMILIES.LOCOMOTION_RAPID],
    NEUROPATHY_SHUFFLE: [...VERB_FAMILIES.LOCOMOTION_RAPID],
    STIFF_LEFT_KNEE: ['SPRINT', 'VAULT', 'LEAP', 'LUNGE', 'RAPID_STAIRS'],
    CRUSHED_LARYNX: [...VERB_FAMILIES.VOCAL_DELIVERY],
    SEVERED_TRACHEA: [...VERB_FAMILIES.VOCAL_DELIVERY],
    MUTE: [...VERB_FAMILIES.VOCAL_DELIVERY],
    CONCUSSION_SEVERE: ['SPRINT', 'VAULT', 'TWO_HANDED_AIM', 'PICK_LOCK'],
}

export const LocomotionTierEnum = z.enum([
    'UNRESTRICTED',
    'LIMPING',
    'CRAWLING',
    'IMMOBILIZED',
    'SESSILE',
])
export type LocomotionTier = z.infer<typeof LocomotionTierEnum>

export const KineticVerbLemmaSchema = z
    .string()
    .min(1)
    .regex(/^[A-Z0-9_]+$/, 'Kinetic verb lemma must be uppercase ASCII')

export const CompiledSomaticMaskSchema = z
    .object({
        entityId: z.string().min(1),
        availableArmsBps: z.number().int().min(0).max(20000),
        legsAvailable: z.number().int().min(0).max(4),
        locomotionTier: LocomotionTierEnum,
        activeConditions: z.array(z.string()),
        bannedKineticVerbs: z.array(KineticVerbLemmaSchema),
    })
    .strict()

export type CompiledSomaticMask = z.infer<typeof CompiledSomaticMaskSchema>

export const KineticAuditQuerySchema = z
    .object({
        entityId: z.string().min(1),
        candidateVerbs: z.array(z.string()),
    })
    .strict()

export type KineticAuditQuery = z.infer<typeof KineticAuditQuerySchema>

export const KineticAuditReceiptSchema = z
    .object({
        allowed: z.boolean(),
        entityId: z.string().min(1),
        breachedVerbs: z.array(z.string()),
        bannedKineticVerbs: z.array(z.string()),
        timestampEpochMs: z.number().int().nonnegative(),
    })
    .strict()

export type KineticAuditReceipt = z.infer<typeof KineticAuditReceiptSchema>
