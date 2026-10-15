export interface TrieNode {
    children: Map<string, TrieNode>
    isEndOfWord: boolean
    topicId?: string
    lemma?: string
}

export class TrieClueDisjointnessSolver {
    private root: TrieNode = { children: new Map(), isEndOfWord: false }

    /**
     * Inserts a forbidden trigger lemma into the search Trie.
     */
    public insertForbiddenLemma(lemma: string, topicId: string): void {
        const normalized = lemma.trim().toLowerCase()
        if (!normalized) return

        let current = this.root
        for (const char of normalized) {
            if (!current.children.has(char)) {
                current.children.set(char, {
                    children: new Map(),
                    isEndOfWord: false,
                })
            }
            current = current.children.get(char)!
        }
        current.isEndOfWord = true
        current.topicId = topicId
        current.lemma = normalized
    }

    /**
     * Queries whether a clue token matches any forbidden trigger lemma in O(length(token)) time.
     */
    public searchCollision(clueToken: string): {
        collision: boolean
        topicId?: string
        lemma?: string
    } {
        const normalized = clueToken.trim().toLowerCase()
        let current = this.root

        for (const char of normalized) {
            if (!current.children.has(char)) {
                return { collision: false }
            }
            current = current.children.get(char)!
        }

        if (current.isEndOfWord) {
            return {
                collision: true,
                topicId: current.topicId,
                lemma: current.lemma,
            }
        }

        return { collision: false }
    }

    /**
     * Enforces the Epistemic Clue Disjointness Invariant:
     * P_clues ∩ (⋃ T_lemmas) == ∅
     */
    public static verifyDisjointness(
        mysteries: Array<{
            topic_id: string
            permitted_clue_tokens: string[]
            trigger_lemma_sets: string[][]
        }>,
    ): {
        valid: boolean
        collisions: Array<{ clue: string; topicId: string; lemma: string }>
    } {
        const solver = new TrieClueDisjointnessSolver()
        const collisions: Array<{
            clue: string
            topicId: string
            lemma: string
        }> = []

        // 1. Populate Trie with all forbidden lemmas across all active mysteries
        for (const mystery of mysteries) {
            for (const lemmaSet of mystery.trigger_lemma_sets) {
                for (const lemma of lemmaSet) {
                    solver.insertForbiddenLemma(lemma, mystery.topic_id)
                }
            }
        }

        // 2. Query all permitted clue tokens against the Trie in O(L) time
        for (const mystery of mysteries) {
            for (const clue of mystery.permitted_clue_tokens) {
                const result = solver.searchCollision(clue)
                if (result.collision) {
                    collisions.push({
                        clue,
                        topicId: result.topicId!,
                        lemma: result.lemma!,
                    })
                }
            }
        }

        return {
            valid: collisions.length === 0,
            collisions,
        }
    }
}
