import { describe, it, expect } from 'vitest'
import { validatePass2Pardons } from '../buz/pardon.buzz.js'
import type { Rule, Authorizer } from '../fce/rule.schema.js'
import type { PardonRecord } from '../fce/pardon.schema.js'

describe('03.laws.unit :: Fail-Closed Pardon Waiver Evaluator', () => {
    const canonicalRules = new Map<string, Rule>([
        [
            'rule_bimanual_lift',
            {
                id: 'rule_bimanual_lift',
                category: 'PHYSICAL',
                severity_class: 'TIER_1_HARD_INVARIANT',
                description:
                    'Two-handed tasks require two functioning arm limbs',
                pardonable: false,
                max_tolerated_pardon_frequency_bps: 0,
                owning_entity_types: ['character'],
            },
        ],
        [
            'rule_aphonic_delivery',
            {
                id: 'rule_aphonic_delivery',
                category: 'SOMATIC',
                severity_class: 'TIER_1_HARD_INVARIANT',
                description:
                    'Characters with crushed larynx cannot speak dialogue',
                pardonable: false,
                max_tolerated_pardon_frequency_bps: 0,
                owning_entity_types: ['character'],
            },
        ],
        [
            'rule_carrying_capacity',
            {
                id: 'rule_carrying_capacity',
                category: 'LOGISTICAL',
                severity_class: 'TIER_2_AUDITED_ONTOLOGY',
                description: 'Carrying mass limits under extreme exertion',
                pardonable: true,
                max_tolerated_pardon_frequency_bps: 2,
                owning_entity_types: ['character', 'possession'],
            },
        ],
    ])

    const canonicalAuthorizers = new Map<string, Authorizer>([
        [
            'auth_showrunner',
            {
                id: 'auth_showrunner',
                name: 'Lead Showrunner',
                role: 'SHOWRUNNER',
                permitted_categories: ['LOGISTICAL', 'SOCIAL'],
            },
        ],
        [
            'auth_guest_director',
            {
                id: 'auth_guest_director',
                name: 'Guest Director',
                role: 'SCENE_DIRECTOR',
                permitted_categories: ['SOCIAL'],
            },
        ],
    ])

    const canonicalEntities = {
        characters: {
            char_wart: { id: 'char_wart' },
            char_bog: { id: 'char_bog' },
        },
        locations: {
            loc_culvert_siphon: { id: 'loc_culvert_siphon' },
        },
        possessions: {
            item_tallow_jug: { id: 'item_tallow_jug' },
        },
    }

    it('fails closed when attempting to waive an unpardonable PHYSICAL rule', () => {
        const illegalPardon: PardonRecord = {
            pardon_id: 'pardon_illegal_lift',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep01',
                scene_id: 'sc02',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_bimanual_lift',
            authorizer_id: 'auth_showrunner',
            justification:
                'Allowing one-armed character to lift heavy pipe alone.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        const pardons = new Map([['pardon_illegal_lift', illegalPardon]])
        const result = validatePass2Pardons(
            pardons,
            canonicalRules,
            canonicalAuthorizers,
            canonicalEntities,
            '0'.repeat(64),
        )

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThanOrEqual(1)
        expect(result.errors[0]).toContain('[PASS 2 PARDON FATAL]')
        expect(result.errors[0]).toContain('pardonable: false')
    })

    it('fails closed when attempting to waive an unpardonable SOMATIC rule', () => {
        const illegalPardon: PardonRecord = {
            pardon_id: 'pardon_illegal_voice',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep01',
                scene_id: 'sc02',
                entity_id: 'char_bog',
            },
            rule_id: 'rule_aphonic_delivery',
            authorizer_id: 'auth_showrunner',
            justification: 'Allowing aphonic character to deliver speech line.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        const pardons = new Map([['pardon_illegal_voice', illegalPardon]])
        const result = validatePass2Pardons(
            pardons,
            canonicalRules,
            canonicalAuthorizers,
            canonicalEntities,
            '0'.repeat(64),
        )

        expect(result.valid).toBe(false)
        expect(result.errors[0]).toContain('[PASS 2 PARDON FATAL]')
    })

    it('fails closed when pardon references a non-existent target entity', () => {
        const danglingEntityPardon: PardonRecord = {
            pardon_id: 'pardon_ghost_entity',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep01',
                scene_id: 'sc01',
                entity_id: 'char_ghost',
            },
            rule_id: 'rule_carrying_capacity',
            authorizer_id: 'auth_showrunner',
            justification: 'Carrying extra emergency equipment through cellar.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        const pardons = new Map([['pardon_ghost_entity', danglingEntityPardon]])
        const result = validatePass2Pardons(
            pardons,
            canonicalRules,
            canonicalAuthorizers,
            canonicalEntities,
            '0'.repeat(64),
        )

        expect(result.valid).toBe(false)
        expect(
            result.errors.some((e) => e.includes('non-existent target entity')),
        ).toBe(true)
    })

    it('fails closed when pardon references an unknown rule ID', () => {
        const unknownRulePardon: PardonRecord = {
            pardon_id: 'pardon_unknown_rule',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep01',
                scene_id: 'sc01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_non_existent',
            authorizer_id: 'auth_showrunner',
            justification: 'Carrying extra emergency equipment through cellar.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        const pardons = new Map([['pardon_unknown_rule', unknownRulePardon]])
        const result = validatePass2Pardons(
            pardons,
            canonicalRules,
            canonicalAuthorizers,
            canonicalEntities,
            '0'.repeat(64),
        )

        expect(result.valid).toBe(false)
        expect(result.errors.some((e) => e.includes('unknown rule_id'))).toBe(
            true,
        )
    })

    it('fails closed when authorizer lacks permission for the rule category', () => {
        const unauthorizedPardon: PardonRecord = {
            pardon_id: 'pardon_unauthorized_scope',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep01',
                scene_id: 'sc01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_carrying_capacity', // LOGISTICAL
            authorizer_id: 'auth_guest_director', // Only permitted: ['SOCIAL']
            justification: 'Guest director granting weight capacity waiver.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        const pardons = new Map([
            ['pardon_unauthorized_scope', unauthorizedPardon],
        ])
        const result = validatePass2Pardons(
            pardons,
            canonicalRules,
            canonicalAuthorizers,
            canonicalEntities,
            '0'.repeat(64),
        )

        expect(result.valid).toBe(false)
        expect(
            result.errors.some((e) =>
                e.includes('[PASS 2 PARDON PERMISSION DENIED]'),
            ),
        ).toBe(true)
    })

    it('emits warning when canon hash diverged since waiver was granted', () => {
        const stalePardon: PardonRecord = {
            pardon_id: 'pardon_stale_hash',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep01',
                scene_id: 'sc01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_carrying_capacity',
            authorizer_id: 'auth_showrunner',
            justification:
                'Carrying extra tallow through culvert siphon safely.',
            granted_against_canon_hash: '1'.repeat(64),
            granted_at_epoch: 0,
        }

        const pardons = new Map([['pardon_stale_hash', stalePardon]])
        const result = validatePass2Pardons(
            pardons,
            canonicalRules,
            canonicalAuthorizers,
            canonicalEntities,
            '2'.repeat(64), // Diverged current canon hash
        )

        expect(result.valid).toBe(true)
        expect(result.errors).toEqual([])
        expect(result.warnings.length).toBe(1)
        expect(result.warnings[0]).toContain('[PARDON WARNING]')
        expect(result.warnings[0]).toContain('Re-ratification recommended')
    })

    it('traps frequency limit breaches under strict audit mode', () => {
        const pardonA: PardonRecord = {
            pardon_id: 'pardon_freq_01',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep01',
                scene_id: 'sc01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_carrying_capacity',
            authorizer_id: 'auth_showrunner',
            justification: 'Exemption for carrying capacity in scene one.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        const pardonB: PardonRecord = {
            pardon_id: 'pardon_freq_02',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep01',
                scene_id: 'sc02',
                entity_id: 'char_bog',
            },
            rule_id: 'rule_carrying_capacity',
            authorizer_id: 'auth_showrunner',
            justification: 'Exemption for carrying capacity in scene two.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        const pardonC: PardonRecord = {
            pardon_id: 'pardon_freq_03',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep01',
                scene_id: 'sc03',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_carrying_capacity',
            authorizer_id: 'auth_showrunner',
            justification: 'Exemption for carrying capacity in scene three.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        // rule_carrying_capacity allows max_tolerated_pardon_frequency_bps: 2
        const pardons = new Map([
            ['pardon_freq_01', pardonA],
            ['pardon_freq_02', pardonB],
            ['pardon_freq_03', pardonC],
        ])

        const strictResult = validatePass2Pardons(
            pardons,
            canonicalRules,
            canonicalAuthorizers,
            canonicalEntities,
            '0'.repeat(64),
            true, // strictFrequencyAudit = true
        )

        expect(strictResult.valid).toBe(false)
        expect(
            strictResult.errors.some((e) =>
                e.includes('[PASS 2 PARDON FREQUENCY BREACH]'),
            ),
        ).toBe(true)
    })

    it('validates compliant audited ontology waiver when properly authorized and within limits', () => {
        const compliantPardon: PardonRecord = {
            pardon_id: 'pardon_compliant_01',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep01',
                scene_id: 'sc01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_carrying_capacity',
            authorizer_id: 'auth_showrunner',
            justification:
                'Carrying extra tallow through culvert siphon safely.',
            granted_against_canon_hash: '0'.repeat(64),
            granted_at_epoch: 0,
        }

        const pardons = new Map([['pardon_compliant_01', compliantPardon]])
        const result = validatePass2Pardons(
            pardons,
            canonicalRules,
            canonicalAuthorizers,
            canonicalEntities,
            '0'.repeat(64),
        )

        expect(result.valid).toBe(true)
        expect(result.errors).toEqual([])
        expect(result.appliedPardons.length).toBe(1)
    })
})
