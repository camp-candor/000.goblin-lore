import { describe, it, expect, beforeAll } from 'vitest'
import * as path from 'node:path'
import * as fs from 'node:fs'
import { TrieClueDisjointnessSolver } from '../src/health/trieClueDisjointness.js'
import { LexicalGate } from '../src/linters/lexicalGate.js'
import {
    DialogueLineASTSchema,
    DialogueLineAST,
} from '../src/types/dialogueAst.js'

describe('Phase 2: Epistemic Firewall & Lexical Gate Battery', () => {
    let lexicalGate: LexicalGate
    const ontologyPath = path.resolve(
        __dirname,
        '../schemas/ontology/verb_families.json',
    )

    beforeAll(() => {
        // Ensure mock ontology exists for testing
        if (!fs.existsSync(path.dirname(ontologyPath))) {
            fs.mkdirSync(path.dirname(ontologyPath), { recursive: true })
        }
    })

    it('enforces O(L) Clue Disjointness and halts on collision', () => {
        const testMysteries = [
            {
                topic_id: 'mystery_poison_flask',
                permitted_clue_tokens: [
                    'tin_cup',
                    'arsenic_residue',
                    'water_stain',
                ],
                trigger_lemma_sets: [['arsenic', 'poison', 'solvent']],
            },
        ]

        // Clue contains "arsenic_residue" while trigger contains "arsenic" -> substring match test
        const solver = new TrieClueDisjointnessSolver()
        solver.insertForbiddenLemma('arsenic', 'mystery_poison_flask')

        const exactMatch = solver.searchCollision('arsenic')
        expect(exactMatch.collision).toBe(true)
        expect(exactMatch.topicId).toBe('mystery_poison_flask')

        const cleanMatch = solver.searchCollision('tin_cup')
        expect(cleanMatch.collision).toBe(false)
    })

    it('validates Dual-Field AST schema strictness', () => {
        const validLine: DialogueLineAST = {
            id: 'line_001',
            speaker_id: 'char_bog',
            dialogue_text: 'Take the iron valve and twist it.',
            camera_parenthetical: 'Dolly in tight on trembling hand.',
            observable_parenthetical: 'Steps toward the bulkhead slowly.',
            extracted_motor_actions: ['TWIST'],
            speech_act: 'ASSERT',
        }

        const parsed = DialogueLineASTSchema.safeParse(validLine)
        expect(parsed.success).toBe(true)

        // Reject un-schemaed legacy single parenthetical
        const legacyLine = {
            ...validLine,
            parenthetical: 'Old single channel',
        }
        const invalidParsed = DialogueLineASTSchema.safeParse(legacyLine)
        expect(invalidParsed.success).toBe(false)
    })

    it('allows negated physical actions and filters abstract direct objects', () => {
        const gate = new LexicalGate(ontologyPath)
        const banned = ['sprint', 'clutch']

        // Negated case: "could not sprint"
        const negatedLine: DialogueLineAST = {
            id: 'line_002',
            speaker_id: 'char_silas',
            dialogue_text: 'I lost my footing.',
            camera_parenthetical: '',
            observable_parenthetical:
                'He was unable to sprint across the yard.',
            extracted_motor_actions: [],
            speech_act: 'ASSERT',
        }
        const resultNeg = gate.auditDialogueLine(negatedLine, banned)
        expect(resultNeg.passed).toBe(true)

        // Metaphorical direct object: "clutches fate"
        const metaphorLine: DialogueLineAST = {
            id: 'line_003',
            speaker_id: 'char_silas',
            dialogue_text: 'This is what remains.',
            camera_parenthetical:
                'Silas clutches his fate with bitter resolve.',
            observable_parenthetical: '',
            extracted_motor_actions: [],
            speech_act: 'ASSERT',
        }
        const resultMetaphor = gate.auditDialogueLine(metaphorLine, banned)
        expect(resultMetaphor.passed).toBe(true)

        // Violation: physical breach without negation
        const breachLine: DialogueLineAST = {
            id: 'line_004',
            speaker_id: 'char_silas',
            dialogue_text: 'Get out of my way!',
            camera_parenthetical: 'Silas sprints toward the doorway.',
            observable_parenthetical: '',
            extracted_motor_actions: [],
            speech_act: 'ASSERT',
        }
        const resultBreach = gate.auditDialogueLine(breachLine, banned)
        expect(resultBreach.passed).toBe(false)
        expect(resultBreach.errorVector?.rule_id).toBe(
            'FATAL_SOMATIC_PROSE_LEAK',
        )
        expect(resultBreach.errorVector?.offending_tokens).toContain('sprint')
    })

    it('executes Level 3 Synthetic Mutation Traps 1 through 6', () => {
        const gate = new LexicalGate(ontologyPath)

        // Trap 1: Clue-Disjointness Collision Trap (P_clues INTERSECT UNION T_lemmas != EMPTY)
        const trap1Result = TrieClueDisjointnessSolver.verifyDisjointness([
            {
                topic_id: 'mystery_poison_flask',
                permitted_clue_tokens: ['arsenic_vial', 'tin_cup'],
                trigger_lemma_sets: [['arsenic', 'poison']],
            },
        ])
        expect(trap1Result.valid).toBe(false)
        expect(trap1Result.collisions.length).toBeGreaterThan(0)
        expect(trap1Result.collisions[0].clue).toBe('arsenic_vial')
        expect(trap1Result.collisions[0].topicId).toBe('mystery_poison_flask')
        expect(trap1Result.collisions[0].lemma).toBe('arsenic')

        // Trap 2: Legacy Single-Parenthetical AST Trap
        const trap2Payload = {
            id: 'line_01',
            speaker_id: 'char_bog',
            dialogue_text: '...',
            parenthetical: 'legacy channel',
        }
        const trap2Parsed = DialogueLineASTSchema.safeParse(trap2Payload)
        expect(trap2Parsed.success).toBe(false)

        // Trap 3: Un-Negated Physical Motor Violation Trap
        const trap3Line: DialogueLineAST = {
            id: 'line_03',
            speaker_id: 'char_silas',
            dialogue_text: 'Watch me go.',
            camera_parenthetical: '',
            observable_parenthetical: 'Silas sprints across the open yard',
            extracted_motor_actions: [],
            speech_act: 'ASSERT',
        }
        const trap3Result = gate.auditDialogueLine(trap3Line, ['sprint'])
        expect(trap3Result.passed).toBe(false)
        expect(trap3Result.errorVector?.rule_id).toBe(
            'FATAL_SOMATIC_PROSE_LEAK',
        )
        expect(trap3Result.errorVector?.offending_tokens).toContain('sprint')

        // Trap 4: Negation Bypass Control (False Positive Immunity)
        const trap4Line: DialogueLineAST = {
            id: 'line_04',
            speaker_id: 'char_silas',
            dialogue_text: 'I cannot make it.',
            camera_parenthetical: '',
            observable_parenthetical:
                'Silas was unable to sprint across the yard',
            extracted_motor_actions: [],
            speech_act: 'ASSERT',
        }
        const trap4Result = gate.auditDialogueLine(trap4Line, ['sprint'])
        expect(trap4Result.passed).toBe(true)

        // Trap 5: Abstract Metaphor Bypass Control (False Positive Immunity)
        const trap5Line: DialogueLineAST = {
            id: 'line_05',
            speaker_id: 'char_silas',
            dialogue_text: 'The outcome is sealed.',
            camera_parenthetical: 'Silas clutches fate in his hands',
            observable_parenthetical: '',
            extracted_motor_actions: [],
            speech_act: 'ASSERT',
        }
        const trap5Result = gate.auditDialogueLine(trap5Line, ['clutch'])
        expect(trap5Result.passed).toBe(true)

        // Trap 6: Machine-Rail Discrepancy Trap (Untrusted AST Deception)
        const trap6Line: DialogueLineAST = {
            id: 'line_06',
            speaker_id: 'char_silas',
            dialogue_text: 'I stood motionless.',
            camera_parenthetical: '',
            observable_parenthetical: '',
            extracted_motor_actions: ['SPRINT'],
            speech_act: 'ASSERT',
        }
        const trap6Result = gate.auditDialogueLine(trap6Line, ['sprint'])
        expect(trap6Result.passed).toBe(false)
        expect(trap6Result.errorVector?.rule_id).toBe('FATAL_SOMATIC_BREACH')
    })
})
