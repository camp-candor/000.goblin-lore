import { describe, it, expect } from 'vitest'
import {
    CharacterConversationalProfileSchema,
    CharacterConversationalProfile,
} from '../val/escalation.val'
import {
    scanAttenuationLeaks,
    evaluateDialogueTurnPreflight,
} from '../buz/escalation.buzz'

describe('10.escalation.unit :: Conversational Escalation Ceiling Bounds Validator', () => {
    const validProfile: CharacterConversationalProfile = {
        actor_id: 'char_wart',
        escalation_ceiling: 3,
        base_stats: {
            spite: 4,
            cunning: 2,
            charm: 1,
            nerve: 2,
            warmth: 1,
        },
        attenuation_tokens: ['amputation', 'turbine', 'coward'],
        is_strained_break: false,
    }

    it('validates a well-formed CharacterConversationalProfile within [1, 5] bounds', () => {
        const parsed = CharacterConversationalProfileSchema.parse(validProfile)
        expect(parsed.actor_id).toBe('char_wart')
        expect(parsed.escalation_ceiling).toBe(3)
        expect(parsed.base_stats.spite).toBe(4)
        expect(parsed.attenuation_tokens).toHaveLength(3)
    })

    it('rejects an escalation ceiling outside [1, 5] bounds (T_0 = $0.00)', () => {
        const invalidProfile = {
            ...validProfile,
            escalation_ceiling: 6,
        }
        expect(() =>
            CharacterConversationalProfileSchema.parse(invalidProfile),
        ).toThrow(/Escalation ceiling maximum is 5/)

        const zeroCeiling = {
            ...validProfile,
            escalation_ceiling: 0,
        }
        expect(() =>
            CharacterConversationalProfileSchema.parse(zeroCeiling),
        ).toThrow(/Escalation ceiling minimum is 1/)
    })

    it('rejects a floating-point escalation ceiling', () => {
        const floatCeiling = {
            ...validProfile,
            escalation_ceiling: 3.5,
        }
        expect(() =>
            CharacterConversationalProfileSchema.parse(floatCeiling),
        ).toThrow(/Escalation ceiling cannot be a float/)
    })

    it('rejects personality base stats outside [1, 5]', () => {
        const badStats = {
            ...validProfile,
            base_stats: {
                ...validProfile.base_stats,
                spite: 0,
            },
        }
        expect(() =>
            CharacterConversationalProfileSchema.parse(badStats),
        ).toThrow()
    })

    it('detects forbidden subtext attenuation token leaks in spoken dialogue text', () => {
        const dialogue = 'We never talk about what happened in the turbine!'
        const leaks = scanAttenuationLeaks(
            dialogue,
            validProfile.attenuation_tokens,
        )
        expect(leaks).toHaveLength(1)
        expect(leaks[0].leaked_token).toBe('turbine')
    })

    it('does not trigger false-positive attenuation leaks on substring matches', () => {
        const dialogue = 'You are a cowardly wretch!'
        // 'coward' is forbidden, but 'cowardly' should not false-positive if word-bounded
        const leaks = scanAttenuationLeaks(dialogue, ['coward'])
        expect(leaks).toHaveLength(0)
    })

    it('fails closed when dialogue leaks an attenuation token without a break state', () => {
        const result = evaluateDialogueTurnPreflight(
            {
                actor_id: 'char_wart',
                proposed_intensity_tier: 2,
                spoken_dialogue_text: 'You left me in the turbine to die!',
                leverage_expended_count: 0,
                override_authorized: false,
            },
            validProfile,
        )

        expect(result.valid).toBe(false)
        expect(result.errorCode).toBe('SUBTEXT_ATTENUATION_LEAK')
        expect(result.leaks).toHaveLength(1)
    })

    it('fails closed when proposed intensity tier exceeds actor escalation ceiling without leverage', () => {
        const result = evaluateDialogueTurnPreflight(
            {
                actor_id: 'char_wart',
                proposed_intensity_tier: 5, // Ceiling is 3
                spoken_dialogue_text: 'Hand over the valve right now or else!',
                leverage_expended_count: 0,
                override_authorized: false,
            },
            validProfile,
        )

        expect(result.valid).toBe(false)
        expect(result.errorCode).toBe('CONVERSATIONAL_CEILING_BREACH')
        expect(result.proposed_tier).toBe(5)
        expect(result.ceiling_tier).toBe(3)
    })

    it('permits escalation beyond ceiling when leverage is expended', () => {
        const result = evaluateDialogueTurnPreflight(
            {
                actor_id: 'char_wart',
                proposed_intensity_tier: 5,
                spoken_dialogue_text: 'Hand over the valve right now or else!',
                leverage_expended_count: 1, // Expending directional leverage string
                override_authorized: false,
            },
            validProfile,
        )

        expect(result.valid).toBe(true)
        expect(result.errorCode).toBe('NONE')
    })

    it('permits escalation and subtext leaks when character has entered an explicit break state', () => {
        const brokenProfile: CharacterConversationalProfile = {
            ...validProfile,
            is_strained_break: true,
        }

        const result = evaluateDialogueTurnPreflight(
            {
                actor_id: 'char_wart',
                proposed_intensity_tier: 4,
                spoken_dialogue_text:
                    'I know you called me a coward after the amputation!',
                leverage_expended_count: 0,
                override_authorized: false,
            },
            brokenProfile,
        )

        expect(result.valid).toBe(true)
        expect(result.errorCode).toBe('NONE')
    })
})
