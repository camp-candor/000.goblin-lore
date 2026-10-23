import { describe, it, expect } from 'vitest'
import {
    scanVoiceRailVerbPolarity,
    harmonizeDialectAndPhrasals,
} from '../buz/polarityScanner.buzz'

describe('39.verbs.unit - Negation-Aware Verb Attribution Polarity Scanner', () => {
    const bogBannedVerbs = [
        'SPRINT',
        'VAULT',
        'SCRAMBLE',
        'CLIMB',
        'DASH',
        'BOLT',
        'GRIP',
    ]

    it('passes category 1 (Negation): modal negation and negative adverbs govern the banned verb', () => {
        const testCases = [
            'Bog reached for the ladder but could not climb the rungs.',
            'Bog was completely unable to vault over the copper pipe.',
            'Bog tried with all his strength, but failed to grip the valve.',
            'Bog never sprinted across the open attic gap in daylight.',
            'Bog retreated slowly without sprinting toward the tunnel.',
        ]

        for (const text of testCases) {
            const res = scanVoiceRailVerbPolarity({
                entityId: 'char_bog',
                characterName: 'Bog',
                characterAliases: ['Elder'],
                markdownProse: text,
                bannedKineticVerbs: bogBannedVerbs,
            })

            expect(res.allowed).toBe(true)
            expect(res.breaches).toHaveLength(0)
            expect(res.parsedClauses[0].isNegated).toBe(true)
        }
    })

    it('fails category 2 (Affirmative): affirmative execution of banned somatic locomotion', () => {
        const testCases = [
            {
                text: 'Bog scrambled up the pantry pipe without hesitation.',
                verb: 'SCRAMBLE',
            },
            {
                text: 'Bog vaulted onto the crossbeam and hissed.',
                verb: 'VAULT',
            },
            {
                text: 'Bog gripped the cold water valve with both hands.',
                verb: 'GRIP',
            },
            {
                text: 'Bog dashed through the culvert to escape the boot.',
                verb: 'DASH',
            },
        ]

        for (const tc of testCases) {
            const res = scanVoiceRailVerbPolarity({
                entityId: 'char_bog',
                characterName: 'Bog',
                characterAliases: [],
                markdownProse: tc.text,
                bannedKineticVerbs: bogBannedVerbs,
            })

            expect(res.allowed).toBe(false)
            expect(res.breaches.length).toBeGreaterThanOrEqual(1)
            expect(res.breaches[0].ruleId).toBe('FATAL_SOMATIC_PROSE_LEAK')
            expect(res.breaches[0].offendingTokens).toContain(tc.verb)
        }
    })

    it('passes category 3 (Passive/Causative): patient is acted upon while another agent executes movement', () => {
        const text = 'Bog was hoisted up through the splinter gap by Wart.'
        const res = scanVoiceRailVerbPolarity({
            entityId: 'char_bog',
            characterName: 'Bog',
            characterAliases: [],
            markdownProse: text,
            bannedKineticVerbs: ['HOIST', 'CLIMB'],
        })

        expect(res.allowed).toBe(true)
        expect(res.breaches).toHaveLength(0)
        expect(res.parsedClauses[0].polarity).toBe('PASSIVE_PATIENT')
    })

    it('fails category 4 (Coreference): pronoun resolves to target character executing banned action', () => {
        const text = 'Bog stared at the high ledge. He vaulted across the void.'
        const res = scanVoiceRailVerbPolarity({
            entityId: 'char_bog',
            characterName: 'Bog',
            characterAliases: [],
            markdownProse: text,
            bannedKineticVerbs: bogBannedVerbs,
        })

        expect(res.allowed).toBe(false)
        expect(res.breaches[0].offendingTokens).toContain('VAULT')
    })

    it('passes category 5 (Idiom/Metaphor): direct object is in the abstract noun whitelist', () => {
        const testCases = [
            'Bog embraced his grim fate as the heating season ended.',
            'Bog let his mind scramble through every memory of the feast.',
            'Bog clutched the painful memory close to his chest.',
        ]

        for (const text of testCases) {
            const res = scanVoiceRailVerbPolarity({
                entityId: 'char_bog',
                characterName: 'Bog',
                characterAliases: [],
                markdownProse: text,
                bannedKineticVerbs: ['EMBRACE', 'SCRAMBLE', 'CLUTCH'],
            })

            expect(res.allowed).toBe(true)
            expect(res.breaches).toHaveLength(0)
            expect(res.parsedClauses[0].isAbstractMetaphor).toBe(true)
        }
    })

    it('enforces subject-attributed actor isolation in multi-character clauses', () => {
        const text = 'Spleen scrambled up the pipe while Bog watched.'
        const res = scanVoiceRailVerbPolarity({
            entityId: 'char_bog',
            characterName: 'Bog',
            characterAliases: [],
            markdownProse: text,
            bannedKineticVerbs: ['SCRAMBLE'],
        })

        // Bog did not scramble, Spleen did. Bog check passes.
        expect(res.allowed).toBe(true)
        expect(res.breaches).toHaveLength(0)
    })

    it('collapses phrasal verbs and dialect idioms into canonical tokens', () => {
        const pour = harmonizeDialectAndPhrasals(
            'Bog poured out the water and pushed away the cup.',
        )
        expect(pour).toContain('POUR_OUT')
        expect(pour).toContain('REFUSE_DRINK')

        const narrowed = harmonizeDialectAndPhrasals(
            'He narrowed eyes at the dark culvert.',
        )
        expect(narrowed).toContain('SUSPECT')
    })

    it('fails closed when an ambiguous pronoun or unknown agent performs a banned verb', () => {
        const text = 'Someone scrambled across the rafters in the pitch black.'
        const res = scanVoiceRailVerbPolarity({
            entityId: 'char_bog',
            characterName: 'Bog',
            characterAliases: [],
            markdownProse: text,
            bannedKineticVerbs: ['SCRAMBLE'],
        })

        expect(res.allowed).toBe(false)
        expect(res.breaches[0].ruleId).toBe('AMBIGUOUS_COREFERENCE_BREACH')
    })
})
