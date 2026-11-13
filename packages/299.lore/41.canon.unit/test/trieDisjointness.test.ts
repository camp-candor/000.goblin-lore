import { describe, it, expect } from 'vitest'
import {
    PropositionTrie,
    TrieClueDisjointnessSolver,
} from '../buz/trieDisjointness.buzz.js'
import type { MysteryTrieIngress } from '../fce/trieDisjointness.bit.js'

describe('41.canon.unit :: O(L) Proposition Trie & Clue-Lemma Disjointness Scanner', () => {
    it('inserts and searches exact single-word and multi-word trigger lemmas in O(L) time', () => {
        const trie = new PropositionTrie()
        trie.insert('arsenic', 'mystery_well', 'prop_poison_01')
        trie.insert('well water', 'mystery_well', 'prop_water_02')
        trie.insert('culvert siphon', 'mystery_culvert', 'prop_culvert_01')

        expect(trie.size).toBe(3)

        // Exact matches
        const match1 = trie.search('arsenic')
        expect(match1).not.toBeNull()
        expect(match1?.topicId).toBe('mystery_well')
        expect(match1?.propositionId).toBe('prop_poison_01')
        expect(match1?.lemma).toBe('arsenic')

        const match2 = trie.search('well water')
        expect(match2).not.toBeNull()
        expect(match2?.lemma).toBe('well water')

        // Case and whitespace insensitivity
        const match3 = trie.search('  ARSENIC  ')
        expect(match3).not.toBeNull()
        expect(match3?.lemma).toBe('arsenic')

        // Non-matches and partial prefix failures
        expect(trie.search('arse')).toBeNull()
        expect(trie.search('well')).toBeNull()
        expect(trie.search('pure water')).toBeNull()
    })

    it('passes verification when permitted clues and forbidden lemmas are strictly disjoint', () => {
        const solver = new TrieClueDisjointnessSolver()
        const mysteries: MysteryTrieIngress[] = [
            {
                topic_id: 'mystery_famine_well',
                forbidden_propositions: [
                    {
                        id: 'prop_arsenic_taint',
                        trigger_lemmas: [
                            'poison',
                            'arsenic',
                            'taint',
                            'well water',
                        ],
                    },
                ],
                permitted_clue_tokens: [
                    'rusted_bucket',
                    'cut_rope',
                    'iron_grate',
                ],
            },
        ]

        solver.loadForbiddenPropositions(mysteries)
        const report = solver.evaluateDisjointness(
            ['rusted_bucket', 'cut_rope', 'iron_grate'],
            'char_bog',
        )

        expect(report.valid).toBe(true)
        expect(report.collisions).toHaveLength(0)
        expect(report.totalLemmasIndexed).toBe(4)
        expect(report.totalCluesEvaluated).toBe(3)
    })

    it('halts with CLUE_DISJOINTNESS_COLLISION when a clue intersects with a forbidden lemma', () => {
        const solver = new TrieClueDisjointnessSolver()
        const mysteries: MysteryTrieIngress[] = [
            {
                topic_id: 'mystery_famine_well',
                forbidden_propositions: [
                    {
                        id: 'prop_arsenic_taint',
                        trigger_lemmas: ['arsenic', 'taint', 'sludge residue'],
                    },
                ],
            },
        ]

        solver.loadForbiddenPropositions(mysteries)

        // "taint" and "sludge residue" are forbidden
        const dirtyClues = [
            'clean_pebble',
            'taint',
            'sludge residue',
            'bronze_thimble',
        ]
        const report = solver.evaluateDisjointness(dirtyClues, 'char_wart')

        expect(report.valid).toBe(false)
        expect(report.collisions).toHaveLength(2)

        const col1 = report.collisions[0]
        expect(col1.collidingToken).toBe('taint')
        expect(col1.topicId).toBe('mystery_famine_well')
        expect(col1.propositionId).toBe('prop_arsenic_taint')
        expect(col1.errorVector.domain).toBe('EPISTEMIC')
        expect(col1.errorVector.rule_id).toBe('CLUE_DISJOINTNESS_COLLISION')
        expect(col1.errorVector.target_entity).toBe('char_wart')

        const col2 = report.collisions[1]
        expect(col2.collidingToken).toBe('sludge residue')
        expect(col2.lemma).toBe('sludge residue')
    })

    it('evaluates static corpus-wide disjointness helper across multiple mystery manifests', () => {
        const corpusMysteries: MysteryTrieIngress[] = [
            {
                topic_id: 'mystery_boiler_crack',
                clue_tokens: ['soot_flake', 'steam_gauge'],
                forbidden_propositions: [
                    {
                        id: 'prop_boiler_sabotage',
                        trigger_lemma_sets: [['sabotage', 'pipe wrench']],
                    },
                ],
            },
            {
                topic_id: 'mystery_missing_tallow',
                clue_tokens: ['grease_stain', 'pipe wrench'], // "pipe wrench" collides with sabotage
                forbidden_propositions: [
                    {
                        id: 'prop_tallow_theft',
                        trigger_lemmas: ['theft', 'mum grissel'],
                    },
                ],
            },
        ]

        const report =
            TrieClueDisjointnessSolver.verifyDisjointnessAcrossCorpus(
                corpusMysteries,
                'system_ontology',
            )

        expect(report.valid).toBe(false)
        expect(report.collisions).toHaveLength(1)
        expect(report.collisions[0].collidingToken).toBe('pipe wrench')
        expect(report.collisions[0].topicId).toBe('mystery_boiler_crack')
    })

    it('normalizes internal whitespace on multi-word lemmas and keeps size idempotent on duplicates', () => {
        const trie = new PropositionTrie()
        trie.insert('  Well   Water ', 'mystery_well', 'prop_water_02')
        trie.insert('well water', 'mystery_well', 'prop_water_02')

        expect(trie.size).toBe(1)
        const match = trie.search('WELL   water')
        expect(match).not.toBeNull()
        expect(match?.lemma).toBe('well water')

        const solver = new TrieClueDisjointnessSolver()
        solver.loadForbiddenPropositions([
            {
                topic_id: 'mystery_well',
                forbidden_propositions: [
                    {
                        id: 'prop_water_02',
                        trigger_lemmas: ['well water', '  WELL   WATER  '],
                    },
                ],
            },
        ])
        const report = solver.evaluateDisjointness(
            ['  well   water '],
            'char_bog',
        )
        expect(report.valid).toBe(false)
        expect(report.totalLemmasIndexed).toBe(1)
        expect(report.collisions).toHaveLength(1)
        expect(report.collisions[0].collidingToken).toBe('well water')
    })
})
