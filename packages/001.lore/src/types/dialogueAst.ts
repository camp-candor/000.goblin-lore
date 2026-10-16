import { z } from 'zod'

// ---------------------------------------------------------------------------
// 1. Dual-Channel Dialogue Line AST Schema (Split Parenthetical Contract)
// ---------------------------------------------------------------------------
export const DialogueLineASTSchema = z
    .object({
        id: z.string().regex(/^line_[a-z0-9_]+$/),
        speaker_id: z.string().regex(/^char_[a-z0-9_]+$/),
        dialogue_text: z.string().min(1),
        camera_parenthetical: z.string().min(1), // Optical staging & emotional register (Remotion / Axis B)
        observable_parenthetical: z.string().min(1), // Interlocutor-visible blocking (Axis A)
        extracted_motor_actions: z.array(z.string().min(1)).default([]),
        turn_index: z.number().int().min(0).default(0),
    })
    .strict()

export type DialogueLineAST = z.infer<typeof DialogueLineASTSchema>

// ---------------------------------------------------------------------------
// 2. Air-Gapped Blind Implicature Probe Schemas
// ---------------------------------------------------------------------------
export const BlindProbeInputSchema = z
    .object({
        speaker_label: z.literal('SPEAKER_A'),
        dialogue_text: z.string().min(1),
        observable_parenthetical: z.string().min(1),
    })
    .strict() // Structurally rejects camera_parenthetical, emotions, or lore tokens

export const BlindImplicatureReceiptSchema = z
    .object({
        inferred_motive: z.string().min(1),
        realized_speech_act: z.enum([
            'ASSERT',
            'BLUFF',
            'DENY',
            'QUESTION',
            'DEFLECT',
            'WITHHOLD',
            'IMPLICIT_WARNING',
        ]),
        inferred_risk_bps: z.number().int().min(0).max(10000),
    })
    .strict()

export type BlindProbeInput = z.infer<typeof BlindProbeInputSchema>
export type BlindImplicatureReceipt = z.infer<
    typeof BlindImplicatureReceiptSchema
>

// ---------------------------------------------------------------------------
// 3. Canonical 4-Tuple Error Signature Vector
// ---------------------------------------------------------------------------
export const ErrorSignatureVectorSchema = z
    .object({
        domain: z.literal('EPISTEMIC'),
        target_entity: z.string().min(1),
        rule_id: z.enum([
            'PRAGMATIC_IMPLICATURE_BREACH',
            'CLUE_DISJOINTNESS_COLLISION',
            'UNAUTHORIZED_PHYSICAL_ACTION',
            'BANNED_KINETIC_MOTOR_BREACH',
        ]),
        offending_tokens: z.array(z.string().min(1)),
        beat_span: z.string().optional(),
    })
    .strict()

export type ErrorSignatureVector = z.infer<typeof ErrorSignatureVectorSchema>
