import { describe, it, expect } from 'vitest'
import { RuleSchema, AuthorizerSchema } from '../fce/rule.schema.js'
import { PardonRecordSchema } from '../fce/pardon.schema.js'
import { validatePass2Pardons } from '../buz/pardon.buzz.js'
import type { Rule, Authorizer } from '../fce/rule.schema.js'
import type { PardonRecord } from '../fce/pardon.schema.js'

describe('Phase 2 Constitutional Rule Registry // Waiver Gauntlet', () => {
    it('enforces deny-by-default on RuleSchema pardonable flag', () => {
        const defaultRule = RuleSchema.parse({
            id: 'rule_somatic_bounds',
            category: 'SOMATIC',
            severity_class: 'TIER_1_HARD_INVARIANT',
            description: 'Limb bounds must be preserved',
        })
        expect(defaultRule.pardonable).toBe(false)
    })

    it('rejects floating-point numbers in max_tolerated_pardon_frequency', () => {
        expect(() =>
            RuleSchema.parse({
                id: 'rule_float_test',
                category: 'LOGISTICAL',
                severity_class: 'TIER_2_AUDITED_ONTOLOGY',
                description: 'Testing float rejection',
                pardonable: true,
                max_tolerated_pardon_frequency: 2.5,
            }),
        ).toThrow('[FLOAT_PROHIBITED]')
    })

    it('rejects pardons with justifications shorter than 20 characters', () => {
        expect(() =>
            PardonRecordSchema.parse({
                id: 'pardon_short_reason',
                target: {
                    episode_id: 'ep001',
                    scene_id: 'sc01',
                    shot_id: 'sh01',
                    entity_id: 'char_bog',
                },
                rule_id: 'rule_carrying_capacity',
                authorizer_id: 'auth_showrunner_main',
                justification: 'Too short',
                granted_against_canon_hash: 'a'.repeat(64),
            }),
        ).toThrow('[PARDON_JUSTIFICATION_TOO_SHORT]')
    })

    it('aborts compilation with fatal error when pardon targets unpardonable rule', () => {
        const hardRule: Rule = {
            id: 'rule_bimanual_lift',
            category: 'PHYSICAL',
            severity_class: 'TIER_1_HARD_INVARIANT',
            description: 'Two-handed tasks require two arms',
            pardonable: false,
            max_tolerated_pardon_frequency: 0,
            owning_entity_types: ['character'],
        }

        const authorizer: Authorizer = {
            id: 'auth_lead',
            name: 'Lead Architect',
            role: 'LEAD_ARCHITECT',
            permitted_severity_classes: [
                'TIER_1_HARD_INVARIANT',
                'TIER_2_AUDITED_ONTOLOGY',
            ],
        }

        const illegalPardon: PardonRecord = {
            id: 'pardon_illegal_lift',
            target: {
                episode_id: 'ep001',
                scene_id: 'sc02',
                shot_id: 'sh03',
                entity_id: 'char_bog',
            },
            rule_id: 'rule_bimanual_lift',
            authorizer_id: 'auth_lead',
            justification:
                'Attempting to allow one-armed box lifting for dramatic scene',
            granted_against_canon_hash: 'f'.repeat(64),
            status: 'ACTIVE',
        }

        const rules = new Map<string, Rule>([['rule_bimanual_lift', hardRule]])
        const authorizers = new Map<string, Authorizer>([
            ['auth_lead', authorizer],
        ])
        const pardons = new Map<string, PardonRecord>([
            ['pardon_illegal_lift', illegalPardon],
        ])
        const entities = { characters: { char_bog: { id: 'char_bog' } } }

        const result = validatePass2Pardons(
            pardons,
            rules,
            authorizers,
            entities,
            'f'.repeat(64),
        )
        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThanOrEqual(1)
        expect(result.errors[0]).toContain('[PASS 2 PARDON FATAL]')
        expect(result.errors[0]).toContain('pardonable: false')
    })

    it('validates audited ontology waiver when authorized and within frequency thresholds', () => {
        const softRule: Rule = {
            id: 'rule_carrying_capacity',
            category: 'LOGISTICAL',
            severity_class: 'TIER_2_AUDITED_ONTOLOGY',
            description: 'Encumbrance limits',
            pardonable: true,
            max_tolerated_pardon_frequency: 3,
            owning_entity_types: ['character'],
        }

        const authorizer: Authorizer = {
            id: 'auth_showrunner',
            name: 'Lead Showrunner',
            role: 'SHOWRUNNER',
            permitted_severity_classes: ['TIER_2_AUDITED_ONTOLOGY'],
        }

        const legalPardon: PardonRecord = {
            id: 'pardon_legal_capacity',
            target: {
                episode_id: 'ep001',
                scene_id: 'sc04',
                shot_id: 'sh01',
                entity_id: 'char_bog',
            },
            rule_id: 'rule_carrying_capacity',
            authorizer_id: 'auth_showrunner',
            justification:
                'Carrying extra emergency tallow across the crawlway hold',
            granted_against_canon_hash: 'e'.repeat(64),
            status: 'ACTIVE',
        }

        const rules = new Map<string, Rule>([
            ['rule_carrying_capacity', softRule],
        ])
        const authorizers = new Map<string, Authorizer>([
            ['auth_showrunner', authorizer],
        ])
        const pardons = new Map<string, PardonRecord>([
            ['pardon_legal_capacity', legalPardon],
        ])
        const entities = { characters: { char_bog: { id: 'char_bog' } } }

        const result = validatePass2Pardons(
            pardons,
            rules,
            authorizers,
            entities,
            'e'.repeat(64),
        )
        expect(result.valid).toBe(true)
        expect(result.errors).toEqual([])
    })
})
