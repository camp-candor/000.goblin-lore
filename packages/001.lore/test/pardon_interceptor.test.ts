import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LocalPardonLedger } from '../src/db/localPardonLedger.js'
import {
    WaiverGate,
    computeEntityHash,
} from '../src/core/governance/waiverGate.js'
import { PardonInterceptor } from '../src/linters/pardonInterceptor.js'
import {
    RuleSchema,
    AuthorizerSchema,
    PardonRecord,
} from '../schemas/pardon.schema.js'

describe('Cryptographic Waiver Gate & Hard Invariant Interceptor', () => {
    let ledger: LocalPardonLedger

    beforeEach(() => {
        ledger = new LocalPardonLedger(':memory:')
    })

    afterEach(() => {
        ledger.close()
    })

    it('Gate 1 immediately halts on hard somatic violations without querying SQLite', () => {
        const rules = new Map([
            [
                'rule_kinetic_limb_conservation',
                RuleSchema.parse({
                    id: 'rule_kinetic_limb_conservation',
                    description: 'Cannot use missing limb.',
                    pardonable: false,
                    severity_class: 'PHYSICAL_SOMATIC',
                    owning_entity_types: ['character'],
                }),
            ],
        ])

        const authorizers = new Map([
            [
                'auth_ed_showrunner',
                AuthorizerSchema.parse({
                    id: 'auth_ed_showrunner',
                    name: 'Ed Showrunner',
                    role: 'SHOWRUNNER',
                    permitted_severity_classes: [
                        'PHYSICAL_SOMATIC',
                        'ONTOLOGY',
                    ],
                }),
            ],
        ])

        const gate = new WaiverGate(ledger, rules, authorizers)

        const context = {
            ruleId: 'rule_kinetic_limb_conservation',
            target: {
                seriesId: 'genesis_core',
                episodeId: 'ep102',
                sceneId: 'sc04',
                entityId: 'char_silas',
            },
            entityPayload: { id: 'char_silas', arm_status: 'severed' },
            currentCanonRoot: '0'.repeat(64),
            violationMessage:
                'Silas attempted bimanual lever pull with crushed arm.',
        }

        const result = gate.evaluate(context)
        expect(result.isExempt).toBe(false)
        expect(result.status).toBe('FATAL_UNPARDONABLE_BREACH')
        expect(result.message).toContain('FATAL_UNPARDONABLE_PHYSICAL_BREACH')
    })

    it('Gate 2 verifies legitimate waiver and stamps COMPLIANT_BY_EXEMPTION', () => {
        const rules = new Map([
            [
                'rule_weight_capacity_ceiling',
                RuleSchema.parse({
                    id: 'rule_weight_capacity_ceiling',
                    description: 'Capacity limit on mass carried.',
                    pardonable: true,
                    severity_class: 'ONTOLOGY',
                    owning_entity_types: ['character'],
                    max_tolerated_pardon_frequency: 5,
                }),
            ],
        ])

        const authorizers = new Map([
            [
                'auth_ed_showrunner',
                AuthorizerSchema.parse({
                    id: 'auth_ed_showrunner',
                    name: 'Ed Showrunner',
                    role: 'SHOWRUNNER',
                    permitted_severity_classes: ['ONTOLOGY'],
                }),
            ],
        ])

        const targetBog = { id: 'char_bog', carry_capacity: 4000 }
        const entityHash = computeEntityHash(targetBog)
        const canonRoot = 'a'.repeat(64)

        const waiver: PardonRecord = {
            id: 'pardon_bog_heavy_basin',
            target: {
                series_id: 'genesis_core',
                episode_id: 'ep102',
                scene_id: 'sc04',
                entity_id: 'char_bog',
            },
            rule_id: 'rule_weight_capacity_ceiling',
            authorizer_id: 'auth_ed_showrunner',
            reason: 'Bog hoists oversized copper basin out of culvert for dramatic effect.',
            granted_against_entity_hash: entityHash,
            granted_against_canon_root: canonRoot,
            injected_state_mutation: {
                vector: 'logistical',
                payload: { capacity_override_grams: 8000 },
            },
        }

        ledger.recordPardon(waiver)

        const gate = new WaiverGate(ledger, rules, authorizers)

        const result = gate.evaluate({
            ruleId: 'rule_weight_capacity_ceiling',
            target: {
                seriesId: 'genesis_core',
                episodeId: 'ep102',
                sceneId: 'sc04',
                entityId: 'char_bog',
            },
            entityPayload: targetBog,
            currentCanonRoot: canonRoot,
            violationMessage: 'Bog exceeds carrying capacity by 3000g.',
        })

        expect(result.isExempt).toBe(true)
        expect(result.status).toBe('COMPLIANT_BY_EXEMPTION')
        expect(result.injectedStateMutation?.vector).toBe('logistical')
    })

    it('Gate 2 traps entity state drift as STALE_ENTITY_PARDON', () => {
        const rules = new Map([
            [
                'rule_weight_capacity_ceiling',
                RuleSchema.parse({
                    id: 'rule_weight_capacity_ceiling',
                    description: 'Capacity limit on mass carried.',
                    pardonable: true,
                    severity_class: 'ONTOLOGY',
                    owning_entity_types: ['character'],
                }),
            ],
        ])

        const authorizers = new Map([
            [
                'auth_ed_showrunner',
                AuthorizerSchema.parse({
                    id: 'auth_ed_showrunner',
                    name: 'Ed Showrunner',
                    role: 'SHOWRUNNER',
                    permitted_severity_classes: ['ONTOLOGY'],
                }),
            ],
        ])

        const initialBog = { id: 'char_bog', strength: 10 }
        const staleHash = computeEntityHash(initialBog)

        ledger.recordPardon({
            id: 'pardon_stale_bog',
            target: {
                series_id: 'genesis_core',
                episode_id: 'ep102',
                scene_id: 'sc05',
                entity_id: 'char_bog',
            },
            rule_id: 'rule_weight_capacity_ceiling',
            authorizer_id: 'auth_ed_showrunner',
            reason: 'Capacity override granted against older character state.',
            granted_against_entity_hash: staleHash,
            granted_against_canon_root: '0'.repeat(64),
        })

        const gate = new WaiverGate(ledger, rules, authorizers)

        // Entity mutates in active scene
        const driftedBog = { id: 'char_bog', strength: 14 }

        const result = gate.evaluate({
            ruleId: 'rule_weight_capacity_ceiling',
            target: {
                seriesId: 'genesis_core',
                episodeId: 'ep102',
                sceneId: 'sc05',
                entityId: 'char_bog',
            },
            entityPayload: driftedBog,
            currentCanonRoot: '0'.repeat(64),
            violationMessage: 'Bog carrying too much.',
        })

        expect(result.isExempt).toBe(false)
        expect(result.status).toBe('STALE_ENTITY_PARDON')
    })

    it('PardonInterceptor throws fatal exception on unpardonable physical violations', () => {
        const interceptor = new PardonInterceptor(ledger)

        expect(() => {
            interceptor.interceptViolation({
                ruleId: 'rule_kinetic_limb_conservation',
                target: {
                    seriesId: 'genesis_core',
                    episodeId: 'ep102',
                    sceneId: 'sc04',
                    entityId: 'char_silas',
                },
                entityPayload: { id: 'char_silas' },
                currentCanonRoot: '0'.repeat(64),
                violationMessage:
                    'Attempted two-handed strike with paralyzed arm.',
            })
        }).toThrow(/FATAL_UNPARDONABLE_PHYSICAL_BREACH/)
    })
})
