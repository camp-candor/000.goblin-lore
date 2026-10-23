import { describe, it, expect } from 'vitest'
import {
    CharacterRelationProfileSchema,
    CharacterRelationProfile,
    EnsembleRedirectionRuleSchema,
} from '../val/relation.val'
import {
    resolveDyadicAttitude,
    buildCharacterEpistemicPrompt,
} from '../buz/relation.buzz'

describe('25.relation.unit :: Relation Unit Default Attitude Mapper', () => {
    const sampleProfile: CharacterRelationProfile = {
        actor_id: 'char_bog',
        relationship_defaults: {
            char_wart: 'DISMISSIVE_SUPERIORITY',
            char_spleen: 'HOSTILE_SUSPICION',
            char_mum_grissel: 'FEARFUL_COMPLIANCE',
        },
        redirection_rules: [
            {
                rule_id: 'red_drainage_dispute',
                actor_id: 'char_bog',
                partner_id: 'char_wart',
                trigger_keyword: 'rations',
                conflict_deflection_target: 'char_spleen',
                sideways_topic_ascii:
                    'boiler pipe corrosion and leaking tallow seals',
                deflection_bias_bps: 8500,
            },
        ],
    }

    it('validates a well-formed CharacterRelationProfileSchema', () => {
        const parsed = CharacterRelationProfileSchema.parse(sampleProfile)
        expect(parsed.actor_id).toBe('char_bog')
        expect(parsed.relationship_defaults.char_wart).toBe(
            'DISMISSIVE_SUPERIORITY',
        )
        expect(parsed.redirection_rules).toHaveLength(1)
    })

    it('fails closed on anti-reflexivity when character defines an attitude toward self', () => {
        const reflexiveProfile = {
            actor_id: 'char_bog',
            relationship_defaults: {
                char_bog: 'HOSTILE_SUSPICION', // ILLEGAL: Self-attitude
            },
            redirection_rules: [],
        }

        expect(() =>
            CharacterRelationProfileSchema.parse(reflexiveProfile),
        ).toThrow(/ANTI_REFLEXIVITY_RELATION_BREACH/)
    })

    it('fails closed when an EnsembleRedirectionRule is self-referential', () => {
        const reflexiveRule = {
            rule_id: 'red_self',
            actor_id: 'char_bog',
            partner_id: 'char_bog', // ILLEGAL
            trigger_keyword: 'culvert',
            conflict_deflection_target: null,
            sideways_topic_ascii: 'steam pressure',
            deflection_bias_bps: 5000,
        }

        expect(() =>
            EnsembleRedirectionRuleSchema.parse(reflexiveRule),
        ).toThrow(/ANTI_REFLEXIVITY_RELATION_BREACH/)
    })

    it('resolves mapped dyadic attitude cleanly', () => {
        const attitude = resolveDyadicAttitude(sampleProfile, 'char_wart')
        expect(attitude).toBe('DISMISSIVE_SUPERIORITY')
    })

    it('falls back to COLD_INDIFFERENCE when an interlocutor is unmapped', () => {
        const attitude = resolveDyadicAttitude(
            sampleProfile,
            'char_stranger_goblin',
        )
        expect(attitude).toBe('COLD_INDIFFERENCE')
    })

    it('compiles epistemic prompt enforcing Ignorance by Omission and Hearsay directives', () => {
        const result = buildCharacterEpistemicPrompt({
            actor_id: 'char_bog',
            interlocutor_id: 'char_wart',
            profile: sampleProfile,
            known_propositions: [
                {
                    slug: 'fact_secret_valve',
                    claim_ascii:
                        'Bog hid the brass valve behind the boiler grate.',
                    standing_tier: 'FACTUAL_WITNESS',
                },
                {
                    slug: 'fact_spleen_theft',
                    claim_ascii:
                        'Spleen took three spoons of tallow from the dry locker.',
                    standing_tier: 'RUMOR_ONLY',
                },
                {
                    slug: 'fact_watchman_movement',
                    claim_ascii:
                        'The surface watchmen reinforced the culvert gate.',
                    standing_tier: 'TOTAL_IGNORANCE', // Must be omitted
                },
            ],
            leverage_held_over_partner: 2,
        })

        expect(result.active_attitude).toBe('DISMISSIVE_SUPERIORITY')
        expect(result.omitted_proposition_count).toBe(1)
        expect(result.hearsay_proposition_count).toBe(1)

        const fullPromptText = result.prompt_directive_lines.join('\n')
        expect(fullPromptText).toContain(
            '[DYADIC STANCE TOWARD char_wart] : DISMISSIVE_SUPERIORITY',
        )
        expect(fullPromptText).toContain(
            '[LEVERAGE ASYMMETRY] : Holds 2 debt string(s)',
        )
        expect(fullPromptText).toContain('[CONFLICT DEFLECTION MANDATE]')
        expect(fullPromptText).toContain(
            '- [UNVERIFIED HEARSAY] Spleen took three spoons of tallow',
        )
        expect(fullPromptText).toContain(
            '- Bog hid the brass valve behind the boiler grate',
        )
        expect(fullPromptText).not.toContain(
            'The surface watchmen reinforced the culvert gate',
        )
    })
})
