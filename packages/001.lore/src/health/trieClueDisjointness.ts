import { ErrorSignatureVector } from "../types/dialogueAst.js";

interface TrieNode {
  children: Map<string, TrieNode>;
  isTerminal: boolean;
  topicId?: string;
  propositionId?: string;
}

export interface ClueDisjointnessCollision {
  collidingToken: string;
  topicId: string;
  propositionId: string;
  errorVector: ErrorSignatureVector;
}

export class PropositionTrie {
  private root: TrieNode = { children: new Map(), isTerminal: false };

  /**
   * Inserts a forbidden trigger lemma into the prefix tree
   */
  public insert(lemma: string, topicId: string, propositionId: string): void {
    let curr = this.root;
    const cleanLemma = lemma.toLowerCase().trim();
    for (const char of cleanLemma) {
      if (!curr.children.has(char)) {
        curr.children.set(char, { children: new Map(), isTerminal: false });
      }
      curr = curr.children.get(char)!;
    }
    curr.isTerminal = true;
    curr.topicId = topicId;
    curr.propositionId = propositionId;
  }

  /**
   * Searches for a matching forbidden prefix in O(length(token))
   */
  public search(token: string): { topicId: string; propositionId: string } | null {
    let curr = this.root;
    const cleanToken = token.toLowerCase().trim();
    for (const char of cleanToken) {
      if (!curr.children.has(char)) {
        break;
      }
      curr = curr.children.get(char)!;
      if (curr.isTerminal && curr.topicId && curr.propositionId) {
        return { topicId: curr.topicId, propositionId: curr.propositionId };
      }
    }

    // Check substring matches? The directive says:
    // "Searches for a matching forbidden prefix in O(length(token))"
    // So hitting a terminal node during prefix traversal is the right logic.
    return null;
  }
}

export class TrieClueDisjointnessSolver {
  private trie: PropositionTrie;

  constructor() {
    this.trie = new PropositionTrie();
  }

  /**
   * Populates the search trie with forbidden trigger lemmas
   */
  public loadForbiddenPropositions(
    mysteries: Array<{
      topic_id: string;
      forbidden_propositions: Array<{ id: string; trigger_lemmas: string[] }>;
    }>
  ): void {
    for (const mystery of mysteries) {
      for (const prop of mystery.forbidden_propositions) {
        for (const lemma of prop.trigger_lemmas) {
          this.trie.insert(lemma, mystery.topic_id, prop.id);
        }
      }
    }
  }

  /**
   * Asserts P_clues intersect Union(T_lemmas) === EmptySet in O(L) time
   */
  public evaluateDisjointness(
    permittedClues: string[],
    targetEntityId: string = "system_ontology"
  ): { valid: boolean; collisions: ClueDisjointnessCollision[] } {
    const collisions: ClueDisjointnessCollision[] = [];

    for (const clue of permittedClues) {
      const match = this.trie.search(clue);
      if (match) {
        collisions.push({
          collidingToken: clue,
          topicId: match.topicId,
          propositionId: match.propositionId,
          errorVector: {
            domain: "EPISTEMIC",
            target_entity: targetEntityId,
            rule_id: "CLUE_DISJOINTNESS_COLLISION",
            offending_tokens: [clue, match.topicId, match.propositionId],
          },
        });
      }
    }

    return {
      valid: collisions.length === 0,
      collisions,
    };
  }
}
