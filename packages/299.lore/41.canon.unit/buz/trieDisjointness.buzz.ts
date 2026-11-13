import type {
    LemmaTrieNode,
    ClueDisjointnessCollision,
    TrieDisjointnessReport,
    MysteryTrieIngress,
    default as CanonTrieBit,
} from '../fce/trieDisjointness.bit.js'
import type { CanonModel } from '../canon.model.js'
import type State from '../../99.core/state.js'

export class PropositionTrie {
    private root: LemmaTrieNode = { children: new Map(), isTerminal: false }
    private lemmaCount: number = 0

    public insert(lemma: string, topicId: string, propositionId: string): void {
        const cleanLemma = lemma.toLowerCase().trim().replace(/\s+/g, ' ')
        if (!cleanLemma) return

        let curr = this.root
        for (const char of cleanLemma) {
            if (!curr.children.has(char)) {
                curr.children.set(char, {
                    children: new Map(),
                    isTerminal: false,
                })
            }
            curr = curr.children.get(char)!
        }
        const wasTerminal = curr.isTerminal
        curr.isTerminal = true
        curr.topicId = topicId
        curr.propositionId = propositionId
        curr.lemma = cleanLemma
        if (!wasTerminal) {
            this.lemmaCount++
        }
    }

    public search(
        token: string,
    ): { topicId: string; propositionId: string; lemma: string } | null {
        const cleanToken = token.toLowerCase().trim().replace(/\s+/g, ' ')
        if (!cleanToken) return null

        let curr = this.root
        for (const char of cleanToken) {
            if (!curr.children.has(char)) {
                return null
            }
            curr = curr.children.get(char)!
        }

        if (
            curr.isTerminal &&
            curr.topicId &&
            curr.propositionId &&
            curr.lemma
        ) {
            return {
                topicId: curr.topicId,
                propositionId: curr.propositionId,
                lemma: curr.lemma,
            }
        }

        return null
    }

    public get size(): number {
        return this.lemmaCount
    }
}

export class TrieClueDisjointnessSolver {
    private trie: PropositionTrie

    constructor() {
        this.trie = new PropositionTrie()
    }

    public loadForbiddenPropositions(mysteries: MysteryTrieIngress[]): void {
        for (const mystery of mysteries) {
            const topicId = mystery.topic_id
            for (const prop of mystery.forbidden_propositions) {
                const propId = prop.id

                if (Array.isArray(prop.trigger_lemmas)) {
                    for (const lemma of prop.trigger_lemmas) {
                        this.trie.insert(lemma, topicId, propId)
                    }
                }

                if (Array.isArray(prop.trigger_lemma_sets)) {
                    for (const set of prop.trigger_lemma_sets) {
                        for (const lemma of set) {
                            this.trie.insert(lemma, topicId, propId)
                        }
                    }
                }
            }
        }
    }

    public evaluateDisjointness(
        permittedClues: string[],
        targetEntityId: string = 'system_ontology',
    ): TrieDisjointnessReport {
        const collisions: ClueDisjointnessCollision[] = []
        const evaluatedClues = permittedClues
            .map((c) => c.toLowerCase().trim().replace(/\s+/g, ' '))
            .filter(Boolean)

        for (const clue of evaluatedClues) {
            const match = this.trie.search(clue)
            if (match) {
                collisions.push({
                    collidingToken: clue,
                    topicId: match.topicId,
                    propositionId: match.propositionId,
                    lemma: match.lemma,
                    errorVector: {
                        domain: 'EPISTEMIC',
                        target_entity: targetEntityId,
                        rule_id: 'CLUE_DISJOINTNESS_COLLISION',
                        offending_tokens: [
                            clue,
                            match.topicId,
                            match.propositionId,
                            match.lemma,
                        ],
                    },
                })
            }
        }

        return {
            valid: collisions.length === 0,
            totalLemmasIndexed: this.trie.size,
            totalCluesEvaluated: evaluatedClues.length,
            collisions,
        }
    }

    public static verifyDisjointnessAcrossCorpus(
        mysteries: MysteryTrieIngress[],
        targetEntityId: string = 'system_ontology',
    ): TrieDisjointnessReport {
        const solver = new TrieClueDisjointnessSolver()
        solver.loadForbiddenPropositions(mysteries)

        const allClues: string[] = []
        for (const m of mysteries) {
            if (Array.isArray(m.permitted_clue_tokens)) {
                allClues.push(...m.permitted_clue_tokens)
            }
            if (Array.isArray(m.clue_tokens)) {
                allClues.push(...m.clue_tokens)
            }
        }

        return solver.evaluateDisjointness(allClues, targetEntityId)
    }
}

export const verifyTrieClueDisjointnessAction = (
    cpy: CanonModel,
    bal: CanonTrieBit,
    ste?: State,
): CanonModel => {
    const dat = bal?.dat
    if (!dat || !dat.mysteries) {
        if (bal?.slv) {
            bal.slv({
                canBit: {
                    idx: 'verify-trie-clue-disjointness-err',
                    val: -1,
                    dat: {
                        valid: false,
                        totalLemmasIndexed: 0,
                        totalCluesEvaluated: 0,
                        collisions: [],
                    },
                },
            })
        }
        return cpy
    }

    const clues = dat.permittedClues || []
    let report: TrieDisjointnessReport

    if (clues.length > 0) {
        const solver = new TrieClueDisjointnessSolver()
        solver.loadForbiddenPropositions(dat.mysteries)
        report = solver.evaluateDisjointness(
            clues,
            dat.targetEntityId || 'system_ontology',
        )
    } else {
        report = TrieClueDisjointnessSolver.verifyDisjointnessAcrossCorpus(
            dat.mysteries,
            dat.targetEntityId || 'system_ontology',
        )
    }

    if (bal?.slv) {
        bal.slv({
            canBit: {
                idx: 'verify-trie-clue-disjointness',
                val: report.valid ? 0 : -1,
                dat: report,
            },
        })
    }

    return cpy
}
