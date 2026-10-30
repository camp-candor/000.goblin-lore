/**
 * Evaluates the set intersection between physical sensory clue tokens
 * and forbidden mystery resolution lemma triggers.
 * Formula: P_clues ∩ ⋃ T_lemmas = ∅
 */
export const verifyClueLemmaDisjointness = (
    clueTokens: string[],
    triggerLemmaSets: string[][],
): { valid: boolean; overlappingTokens: string[] } => {
    const triggerSet = new Set<string>()

    for (const set of triggerLemmaSets) {
        for (const lemma of set) {
            triggerSet.add(lemma.toLowerCase().trim())
        }
    }

    const overlappingTokens: string[] = []

    for (const clue of clueTokens) {
        const normalized = clue.toLowerCase().trim()
        if (triggerSet.has(normalized)) {
            overlappingTokens.push(clue)
        }
    }

    return {
        valid: overlappingTokens.length === 0,
        overlappingTokens,
    }
}
