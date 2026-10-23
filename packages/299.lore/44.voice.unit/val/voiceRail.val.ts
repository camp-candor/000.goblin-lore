import { z } from 'zod'

/**
 * Standard stop words filtered during subtext lemma overlap analysis.
 */
export const STOP_WORDS = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'has',
    'he',
    'in',
    'is',
    'it',
    'its',
    'of',
    'on',
    'that',
    'the',
    'to',
    'was',
    'were',
    'will',
    'with',
    'his',
    'her',
    'their',
    'they',
])

/**
 * Schema defining the five mandatory Voice Rail Markdown sections.
 */
export const VoiceRailSectionsSchema = z
    .object({
        surfaceWant: z.string().min(1, 'Surface want cannot be empty'),
        actualWant: z.string().min(1, 'Actual want cannot be empty'),
        blindSpot: z.string().min(1, 'Blind spot cannot be empty'),
        voiceNotes: z.string().min(1, 'Voice notes cannot be empty'),
        fewShotLines: z
            .array(z.string().min(1))
            .min(1, 'At least one few-shot line is required'),
    })
    .strict()

export type VoiceRailSections = z.infer<typeof VoiceRailSectionsSchema>

/**
 * Verification result schema for want differentiation.
 */
export const WantDifferentiationResultSchema = z
    .object({
        characterId: z.string().regex(/^char_[a-z0-9_]+$/),
        hasAllSections: z.boolean(),
        surfaceWant: z.string(),
        actualWant: z.string(),
        blindSpot: z.string(),
        voiceNotes: z.string(),
        fewShotLineCount: z.number().int().nonnegative(),
        overlapPercentageBps: z.number().int().min(0).max(10000), // 0 to 10000 bps (0.00% to 100.00%)
        contrastPass: z.boolean(),
        cleanOfArtifacts: z.boolean(),
        isValid: z.boolean(),
        errorReason: z.string().optional(),
    })
    .strict()

export type WantDifferentiationResult = z.infer<
    typeof WantDifferentiationResultSchema
>

/**
 * Tokenizes text into lowercase 7-bit ASCII lemma words excluding stop words.
 */
export function extractSignificantLemmas(text: string): Set<string> {
    const clean = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ')
    const tokens = clean
        .split(/\s+/)
        .filter((t) => t.length > 2 && !STOP_WORDS.has(t))
    return new Set(tokens)
}

/**
 * Calculates Jaccard token overlap in integer basis points (0 to 10000).
 */
export function computeLemmaOverlapBps(
    setA: Set<string>,
    setB: Set<string>,
): number {
    if (setA.size === 0 || setB.size === 0) return 0
    let intersectionCount = 0
    for (const item of setA) {
        if (setB.has(item)) intersectionCount++
    }
    const unionSize = new Set([...setA, ...setB]).size
    if (unionSize === 0) return 0
    return Math.round((intersectionCount / unionSize) * 10000)
}
