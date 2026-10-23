import { z } from 'zod'

/**
 * Closed enumeration of canonical comedic registers.
 * Structured generation tags designed to prevent generic model collapse.
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
 * Prohibited Latinate tokens that indicate generic LLM output smoothing.
 */
export const BANNED_LATINATE_LEMMAS = [
    'furthermore',
    'testament',
    'palpable',
    'moreover',
    'symphony',
    'tapestry',
    'delve',
] as const

/**
 * Register instruction metadata contract for prompt grounding.
 */
export const RegisterInstructionDefinitionSchema = z
    .object({
        register: ComedicRegisterEnum,
        instructionDirective: z.string().min(1),
        prohibitedBehaviors: z.array(z.string().min(1)).min(1),
        deliveryConstraint: z.string().min(1),
    })
    .strict()

export type RegisterInstructionDefinition = z.infer<
    typeof RegisterInstructionDefinitionSchema
>

/**
 * Canonical registry mapping each comedic register to its generation directives.
 */
export const COMEDIC_REGISTER_REGISTRY: Record<
    ComedicRegister,
    RegisterInstructionDefinition
> = {
    deadpan: {
        register: 'deadpan',
        instructionDirective:
            'Deliver dialogue with absolute awareness of absurdity but zero emotional reaction or outward amusement.',
        prohibitedBehaviors: [
            'smiling',
            'smirking',
            'explaining the joke',
            'vocal pitch flare',
        ],
        deliveryConstraint:
            'Monotone pitch curve, unblinking delivery, dry cadence.',
    },
    self_serious: {
        register: 'self_serious',
        instructionDirective:
            'Treat trivial or absurd disputes with life-or-death existential gravity; the character must never know it is funny.',
        prohibitedBehaviors: [
            'self-deprecation',
            'winking at audience',
            'breaking posture',
        ],
        deliveryConstraint:
            'Rigid posture, intense eye contact, solemn dramatic conviction.',
    },
    oblivious: {
        register: 'oblivious',
        instructionDirective:
            'Completely miss the primary danger or conflict, fixating entirely on an irrelevant domestic detail.',
        prohibitedBehaviors: [
            'noticing imminent doom',
            'understanding interlocutor subtext',
        ],
        deliveryConstraint:
            'Breezy pacing, distraction pauses, non-sequitur topic shifts.',
    },
    hyper_literal: {
        register: 'hyper_literal',
        instructionDirective:
            'Interpret all idioms, metaphors, and casual banter as exact mechanical or legalistic statements of fact.',
        prohibitedBehaviors: [
            'accepting metaphors',
            'understanding colloquial sarcasm',
        ],
        deliveryConstraint:
            'Precise lexical pronunciation, pedantic numerical corrections.',
    },
    aggrieved_bureaucrat: {
        register: 'aggrieved_bureaucrat',
        instructionDirective:
            'Redirect all physical danger into procedural grievances, jurisdictional violations, and tally disputes.',
        prohibitedBehaviors: [
            'heroic willingness',
            'unauthorized favors',
            'ignoring inventory counts',
        ],
        deliveryConstraint:
            'Exasperated sighing, quotation of non-existent protocols.',
    },
    clinical_gravel: {
        register: 'clinical_gravel',
        instructionDirective:
            'Describe gruesome bodily trauma, catastrophic decay, and filth in detached, dry, diagnostic terminology.',
        prohibitedBehaviors: [
            'hysteria',
            'empathy displays',
            'disgust vocalizations',
        ],
        deliveryConstraint:
            'Low pitch register, slow rhythmic cadence, zero panic.',
    },
    defensive_deflector: {
        register: 'defensive_deflector',
        instructionDirective:
            'Interpret every observation or question as an accusation of incompetence and retaliate with an unprovoked counter-charge.',
        prohibitedBehaviors: [
            'admitting fault',
            'quiet listening',
            'direct answers',
        ],
        deliveryConstraint:
            'Rapid-fire interruptions, accusatory pointing, volume spike.',
    },
}

/**
 * Result contract for comedic register validation.
 */
export const RegisterValidationResultSchema = z
    .object({
        characterId: z.string().regex(/^char_[a-z0-9_]+$/),
        register: ComedicRegisterEnum,
        instructionDirective: z.string(),
        detectedSlopTokens: z.array(z.string()),
        isValid: z.boolean(),
        errorCode: z.string().optional(),
        message: z.string().optional(),
    })
    .strict()

export type RegisterValidationResult = z.infer<
    typeof RegisterValidationResultSchema
>
