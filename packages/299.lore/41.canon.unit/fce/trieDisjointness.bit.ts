export interface LemmaTrieNode {
    children: Map<string, LemmaTrieNode>
    isTerminal: boolean
    topicId?: string
    propositionId?: string
    lemma?: string
}

export interface ErrorSignatureVector {
    domain: string
    target_entity: string
    rule_id: string
    offending_tokens: string[]
}

export interface ClueDisjointnessCollision {
    collidingToken: string
    topicId: string
    propositionId: string
    lemma: string
    errorVector: ErrorSignatureVector
}

export interface TrieDisjointnessReport {
    valid: boolean
    totalLemmasIndexed: number
    totalCluesEvaluated: number
    collisions: ClueDisjointnessCollision[]
}

export interface MysteryTrieIngress {
    topic_id: string
    permitted_clue_tokens?: string[]
    clue_tokens?: string[]
    forbidden_propositions: Array<{
        id: string
        statement?: string
        trigger_lemmas?: string[]
        trigger_lemma_sets?: string[][]
    }>
}

export default interface CanonTrieBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        mysteries: MysteryTrieIngress[]
        permittedClues?: string[]
        targetEntityId?: string
    }
    slv?: (result: {
        canBit: {
            idx: string
            val: number
            dat: TrieDisjointnessReport
        }
    }) => void
}
