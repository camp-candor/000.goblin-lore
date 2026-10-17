import { z } from 'zod'

// ---------------------------------------------------------------------------
// 1. Anatomical Vocal Conditions & Prosodic Cadence Taxonomies
// ---------------------------------------------------------------------------
export const VocalTractConditionEnum = z.enum([
    'mute',
    'crushed_larynx',
    'severed_trachea',
    'bilateral_vocal_cord_paralysis',
    'punctured_lung',
    'acute_asphyxiation',
    'concussive_shock',
])

export type VocalTractCondition = z.infer<typeof VocalTractConditionEnum>

export const BannedCadenceEnum = z.enum([
    'RAPID_STACCATO',
    'RISING_INFLECTION_INTERROGATIVE',
    'CHEERFUL_MODULATION',
    'UPBEAT_LILT',
    'SING_SONG_RESONANCE',
])

export type BannedCadence = z.infer<typeof BannedCadenceEnum>

// ---------------------------------------------------------------------------
// 2. Character Vocal Profile Schema
// ---------------------------------------------------------------------------
export const CharacterVocalProfileSchema = z
    .object({
        character_id: z.string().regex(/^char_[a-z0-9_]+$/),
        vitality_bps: z.number().int().min(0).max(10000).default(10000),
        is_conscious: z.boolean().default(true),
        active_conditions: z.array(VocalTractConditionEnum).default([]),
        banned_kinetic_verbs: z.array(z.string().min(1)).default([]),
        banned_cadences: z.array(BannedCadenceEnum).default([]),
        updated_at_epoch: z.number().int().min(0).default(0),
    })
    .strict()

export type CharacterVocalProfile = z.infer<typeof CharacterVocalProfileSchema>

// ---------------------------------------------------------------------------
// 3. Dialogue AST Line Proposal for Vocal Feasibility Verification
// ---------------------------------------------------------------------------
export const ProposedDialogueLineSchema = z
    .object({
        line_id: z.string().regex(/^line_[a-z0-9_]+$/),
        speaker_id: z.string().regex(/^char_[a-z0-9_]+$/),
        dialogue_text: z.string(),
        observable_parenthetical: z.string().default(''),
        delivery_cadences: z.array(BannedCadenceEnum).default([]),
        is_non_verbal_expression: z.boolean().default(false),
    })
    .strict()

export type ProposedDialogueLine = z.infer<typeof ProposedDialogueLineSchema>
