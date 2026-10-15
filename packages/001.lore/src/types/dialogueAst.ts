import { z } from 'zod'

export const DialogueLineASTSchema = z
    .object({
        id: z.string().min(1),
        speaker_id: z.string().regex(/^char_[a-z0-9_]+$/),
        dialogue_text: z.string(),
        // Omniscient director & Remotion camera/lighting instructions (never visible to interlocutor)
        camera_parenthetical: z.string().default(''),
        // Sanitized physical blocking observable by in-room interlocutors within facing arc
        observable_parenthetical: z.string().default(''),
        // Explicitly self-reported motor verbs extracted at inference
        extracted_motor_actions: z.array(z.string().min(1)).default([]),
        speech_act: z
            .enum([
                'ASSERT',
                'DENY',
                'QUESTION',
                'WITHHOLD',
                'DEFLECT',
                'BLUFF',
                'IMPLICIT_WARNING',
            ])
            .default('ASSERT'),
    })
    .strict()

export type DialogueLineAST = z.infer<typeof DialogueLineASTSchema>

export const SceneDialogueASTSchema = z
    .object({
        scene_id: z.string().min(1),
        lines: z.array(DialogueLineASTSchema),
    })
    .strict()

export type SceneDialogueAST = z.infer<typeof SceneDialogueASTSchema>

export interface ErrorSignatureVector {
    domain: 'EPISTEMIC' | 'SOMATIC' | 'LOGISTICAL'
    target_entity: string
    rule_id: string
    offending_tokens: string[]
    span?: {
        line_id?: string
        text_snippet?: string
    }
}
