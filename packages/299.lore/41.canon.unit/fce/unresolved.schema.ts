import { z } from 'zod'
import {
    CharacterIdSchema,
    MysteryIdSchema,
} from '../../38.types.unit/fce/ident.schema'

export const EpistemicHorizonEnum = z.enum([
    'TOTAL_IGNORANCE',
    'FALSE_BELIEF',
    'RUMOR_ONLY',
    'PARTIAL_OBSERVATION',
])
export type EpistemicHorizon = z.infer<typeof EpistemicHorizonEnum>

export const UnresolvedMysterySchema = z
    .object({
        schema_version: z.number().int().min(1).default(1),
        topic_id: MysteryIdSchema,
        description: z.string().min(10),
        forbidden_propositions: z.array(z.string().min(5)).min(1),
        trigger_lemma_sets: z.array(z.array(z.string().min(2)).min(2)).min(1),
        permitted_clue_tokens: z.array(z.string().min(2)).default([]),
        epistemic_horizons: z
            .record(CharacterIdSchema, EpistemicHorizonEnum)
            .default({}),
        distorted_beliefs: z
            .record(
                CharacterIdSchema,
                z
                    .string()
                    .min(5)
                    .max(500)
                    .regex(
                        /^[^[\]]+$/,
                        'No square brackets permitted in distorted belief strings',
                    ),
            )
            .default({}),
        human_promotion_condition: z.string().min(10),
    })
    .strict()
    .superRefine((data, ctx) => {
        // 1. Clue-Lemma Disjointness Theorem: P_clues ∩ ⋃ T_lemmas = ∅
        const allTriggerLemmas = new Set<string>()
        for (const lemmaSet of data.trigger_lemma_sets) {
            for (const lemma of lemmaSet) {
                allTriggerLemmas.add(lemma.toLowerCase().trim())
            }
        }

        for (const clue of data.permitted_clue_tokens) {
            if (allTriggerLemmas.has(clue.toLowerCase().trim())) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    path: ['permitted_clue_tokens'],
                    message: `CLUE_LEMMA_OVERLAP: Permitted clue token "${clue}" violates Clue-Lemma Disjointness Theorem by overlapping with trigger_lemma_sets`,
                })
            }
        }

        // 2. Distorted Belief Co-Requisite Enforcement
        for (const [charId, horizon] of Object.entries(
            data.epistemic_horizons,
        )) {
            if (horizon === 'FALSE_BELIEF' || horizon === 'RUMOR_ONLY') {
                const belief = data.distorted_beliefs[charId]
                if (!belief || belief.trim().length === 0) {
                    ctx.addIssue({
                        code: z.ZodIssueCode.custom,
                        path: ['distorted_beliefs', charId],
                        message: `MISSING_DISTORTED_BELIEF: Character "${charId}" assigned horizon "${horizon}" must possess an explicit distorted belief text`,
                    })
                }
            }
        }
    })

export type UnresolvedMystery = z.infer<typeof UnresolvedMysterySchema>
