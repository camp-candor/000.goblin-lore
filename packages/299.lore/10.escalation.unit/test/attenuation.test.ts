import { describe, it, expect } from 'vitest'
import {
    AttenuationDirectiveSchema,
    AttenuationDirective,
} from '../val/attenuation.val'
import { auditDialogueAttenuation } from '../buz/attenuation.buzz'

describe('10.escalation.unit :: Subtext Attenuation Token Blocker Schema', () => {
    const activeDirective: AttenuationDirective = {
        directive_id: 'att_famine_secret',
        actor_id: 'char_spleen',
        suppression_factor_bps: 8500, // S = 0.85
        banned_tokens: ['famine', 'rations', 'hoarded', 'culvert'],
        tactical_proxies: [
            'item_silver_spoon',
            'brass_valve_09',
            'grease_threads',
        ],
        behavioral_constraint: 'SUBTEXTUAL_DISPLACEMENT_MANDATED',
    }

    it('validates a well-formed AttenuationDirectiveSchema under high suppression', () => {
        const parsed = AttenuationDirectiveSchema.parse(activeDirective)
        expect(parsed.directive_id).toBe('att_famine_secret')
        expect(parsed.banned_tokens).toHaveLength(4)
        expect(parsed.tactical_proxies).toHaveLength(3)
        expect(parsed.suppression_factor_bps).toBe(8500)
    })

    it('rejects an AttenuationDirective with empty banned_tokens when S >= 7000 bps', () => {
        const invalidDirective = {
            ...activeDirective,
            banned_tokens: [],
        }
        expect(() =>
            AttenuationDirectiveSchema.parse(invalidDirective),
        ).toThrow(/ATTENUATION_SCHEMA_BREACH/)
    })

    it('passes candidate dialogue that displaces tension onto physical proxies', () => {
        const result = auditDialogueAttenuation({
            actor_id: 'char_spleen',
            dialogue_text:
                'You have not cleaned the grease off this brass valve since third cycle.',
            directive: activeDirective,
            is_break_state_authorized: false,
        })

        expect(result.passed).toBe(true)
        expect(result.errorCode).toBe('NONE')
        expect(result.violations).toHaveLength(0)
    })

    it('negative control: catches explicit literal leakage of banned Underneath lemmas at T_0 = $0.00', () => {
        const result = auditDialogueAttenuation({
            actor_id: 'char_spleen',
            dialogue_text:
                'I know you hoarded the rations during the famine, Bog!',
            directive: activeDirective,
            is_break_state_authorized: false,
        })

        expect(result.passed).toBe(false)
        expect(result.errorCode).toBe('ATTENUATION_MASK_VIOLATION')
        expect(result.violations.map((v) => v.leaked_lemma)).toEqual(
            expect.arrayContaining(['hoarded', 'rations', 'famine']),
        )
    })

    it('negative control: catches case-insensitive and uppercase leaks', () => {
        const result = auditDialogueAttenuation({
            actor_id: 'char_spleen',
            dialogue_text: 'Check the CULVERT before you speak to me.',
            directive: activeDirective,
            is_break_state_authorized: false,
        })

        expect(result.passed).toBe(false)
        expect(result.errorCode).toBe('ATTENUATION_MASK_VIOLATION')
        expect(result.violations[0].leaked_lemma).toBe('culvert')
    })

    it('does not trigger false positives on partial substring collisions', () => {
        // 'rot' is not in banned_tokens, but test that word boundaries prevent accidental substring hits
        const customDirective: AttenuationDirective = {
            ...activeDirective,
            banned_tokens: ['rot'],
        }

        const result = auditDialogueAttenuation({
            actor_id: 'char_spleen',
            dialogue_text: 'Rotate the spanner clockwise to clear the threads.',
            directive: customDirective,
            is_break_state_authorized: false,
        })

        expect(result.passed).toBe(true)
        expect(result.violations).toHaveLength(0)
    })

    it('relaxes attenuation filtering when suppression factor S < 7000 bps (Farce / Low Suppression)', () => {
        const relaxedDirective: AttenuationDirective = {
            directive_id: 'att_relaxed',
            actor_id: 'char_spleen',
            suppression_factor_bps: 2000, // S = 0.20
            banned_tokens: [],
            tactical_proxies: [],
            behavioral_constraint: 'DIRECT_EXPRESSION_PERMITTED',
        }

        const result = auditDialogueAttenuation({
            actor_id: 'char_spleen',
            dialogue_text:
                'I know you hoarded the rations during the famine, Bog!',
            directive: relaxedDirective,
            is_break_state_authorized: false,
        })

        expect(result.passed).toBe(true)
        expect(result.errorCode).toBe('NONE')
    })

    it('permits forbidden lemmas when an explicit break state is authorized', () => {
        const result = auditDialogueAttenuation({
            actor_id: 'char_spleen',
            dialogue_text:
                'I know you hoarded the rations during the famine, Bog!',
            directive: activeDirective,
            is_break_state_authorized: true, // Psychological break override
        })

        expect(result.passed).toBe(true)
        expect(result.errorCode).toBe('NONE')
    })
})
