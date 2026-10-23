import { z } from 'zod'

/**
 * Universal Abstract Direct Object (dobj) Whitelist
 * Metaphorical/cognitive targets that bypass somatic physical capability gates.
 */
export const ABSTRACT_DOBJ_WHITELIST = [
    'FATE',
    'DESTINY',
    'SILENCE',
    'SHADOW',
    'THOUGHT',
    'THOUGHTS',
    'MEMORY',
    'MEMORIES',
    'GRIEF',
    'FEAR',
    'IDEA',
    'IDEAS',
    'TRADITION',
    'TERROR',
    'PATIENCE',
    'PRIDE',
    'VOID',
    'DARKNESS',
    'HOPE',
] as const

/**
 * Negative Polarity Modifiers & Failure Modals
 */
export const NEGATION_MODIFIERS = [
    'NOT',
    'NEVER',
    'CANNOT',
    'CANT',
    'COULDNT',
    'COULD NOT',
    'UNABLE TO',
    'FAILED TO',
    'REFUSED TO',
    'REFUSES TO',
    'WITHOUT',
    'NEITHER',
    'HARDLY',
    'SCARCELY',
    'NO LONGER',
] as const

/**
 * Multi-word Phrasal Verb Collapse Map (Two-Stage Dialect Normalization)
 */
export const PHRASAL_VERB_COLLAPSE_MAP: Record<string, string> = {
    'POUR OUT': 'POUR_OUT',
    'POURS OUT': 'POUR_OUT',
    'POURED OUT': 'POUR_OUT',
    'TIP OUT': 'POUR_OUT',
    'PUSH AWAY': 'REFUSE_DRINK',
    'PUSHES AWAY': 'REFUSE_DRINK',
    'PUSHED AWAY': 'REFUSE_DRINK',
    'LEAVE UNTOUCHED': 'REFUSE_DRINK',
    'LEAVES UNTOUCHED': 'REFUSE_DRINK',
    'EYE WARILY': 'SUSPECT',
    'EYES WARILY': 'SUSPECT',
    'NARROW EYES AT': 'SUSPECT',
    'NARROWS EYES AT': 'SUSPECT',
    'NARROWED EYES AT': 'SUSPECT',
    'REACH OUT': 'REACH_OUT',
    'REACHES OUT': 'REACH_OUT',
    'REACHED OUT': 'REACH_OUT',
}

export const PolarityClassificationEnum = z.enum([
    'AFFIRMATIVE',
    'NEGATED',
    'METAPHORICAL',
    'AMBIGUOUS_COREFERENCE',
    'PASSIVE_PATIENT',
])
export type PolarityClassification = z.infer<typeof PolarityClassificationEnum>

export const ParsedActionClauseSchema = z
    .object({
        rawClause: z.string(),
        subject: z.string(),
        verbLemma: z.string(),
        directObject: z.string().nullable(),
        polarity: PolarityClassificationEnum,
        isNegated: z.boolean(),
        isAbstractMetaphor: z.boolean(),
        confidence: z.number().min(0).max(1),
    })
    .strict()

export type ParsedActionClause = z.infer<typeof ParsedActionClauseSchema>

export const ErrorSignatureVectorSchema = z
    .object({
        domain: z.literal('SOMATIC'),
        targetEntity: z.string(),
        ruleId: z.string(),
        offendingTokens: z.array(z.string()),
        span: z
            .object({
                lineNumber: z.number().int().positive().optional(),
                textSnippet: z.string(),
            })
            .strict(),
    })
    .strict()

export type ErrorSignatureVector = z.infer<typeof ErrorSignatureVectorSchema>

export const PolarityScanResultSchema = z
    .object({
        allowed: z.boolean(),
        targetEntity: z.string(),
        breaches: z.array(ErrorSignatureVectorSchema),
        parsedClauses: z.array(ParsedActionClauseSchema),
        totalClausesEvaluated: z.number().int().nonnegative(),
    })
    .strict()

export type PolarityScanResult = z.infer<typeof PolarityScanResultSchema>
