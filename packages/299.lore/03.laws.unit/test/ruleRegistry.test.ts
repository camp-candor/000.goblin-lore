import { describe, it, expect } from 'vitest'
import {
    RuleSchema,
    AuthorizerSchema,
    type Rule,
    type Authorizer,
} from '../fce/rule.schema.js'
import { PardonRecordSchema, type PardonRecord } from '../fce/pardon.schema.js'

describe('03.laws.unit :: Constitutional Rule Registry & Pardon Schema', () => {
    it('validates a compliant unpardonable physical rule', () => {
        const candidate = {
            id: 'rule_kinetic_limb_conservation',
            category: 'PHYSICAL',
            severity_class: 'TIER_1_HARD_INVARIANT',
            description:
                'Characters cannot execute physical actions requiring severed limbs.',
            pardonable: false,
            max_tolerated_pardon_frequency_bps: 0,
            owning_entity_types: ['character'],
        }
        const result = RuleSchema.safeParse(candidate)
        expect(result.success).toBe(true)
    })

    it('rejects self-contradictory rules declaring PHYSICAL with pardonable: true', () => {
        const illegal = {
            id: 'rule_kinetic_limb_conservation',
            category: 'PHYSICAL',
            severity_class: 'TIER_1_HARD_INVARIANT',
            description: 'Illegal physical rule waiver.',
            pardonable: true,
            max_tolerated_pardon_frequency_bps: 100,
            owning_entity_types: ['character'],
        }
        const result = RuleSchema.safeParse(illegal)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                '[UNPARDONABLE_INVARIANT_BREACH]',
            )
        }
    })

    it('rejects self-contradictory rules declaring SOMATIC with pardonable: true', () => {
        const illegal = {
            id: 'rule_crushed_larynx_aphonia',
            category: 'SOMATIC',
            severity_class: 'TIER_1_HARD_INVARIANT',
            description: 'Crushed larynx cannot speak dialogue.',
            pardonable: true,
            max_tolerated_pardon_frequency_bps: 100,
            owning_entity_types: ['character'],
        }
        const result = RuleSchema.safeParse(illegal)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                '[UNPARDONABLE_INVARIANT_BREACH]',
            )
        }
    })

    it('rejects self-contradictory rules declaring EPISTEMIC with pardonable: true', () => {
        const illegal = {
            id: 'rule_unresolved_epistemic_leak',
            category: 'EPISTEMIC',
            severity_class: 'TIER_1_HARD_INVARIANT',
            description:
                'Characters with total ignorance cannot leak protected canon secrets.',
            pardonable: true,
            max_tolerated_pardon_frequency_bps: 100,
            owning_entity_types: ['character', 'scene'],
        }
        const result = RuleSchema.safeParse(illegal)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                '[UNPARDONABLE_INVARIANT_BREACH]',
            )
        }
    })

    it('permits valid LOGISTICAL and SOCIAL rules with pardonable: true', () => {
        const validLogistics = {
            id: 'rule_equip_slot_borrowing',
            category: 'LOGISTICAL',
            severity_class: 'TIER_2_AUDITED_ONTOLOGY',
            description:
                'Entities may borrow adjacent equipment slot under emergency triage.',
            pardonable: true,
            max_tolerated_pardon_frequency_bps: 2000,
            owning_entity_types: ['character', 'possession'],
        }
        expect(RuleSchema.safeParse(validLogistics).success).toBe(true)
    })

    it('rejects floating-point numbers in basis points tolerance', () => {
        const floatBreach = {
            id: 'rule_weight_capacity_ceiling',
            category: 'LOGISTICAL',
            severity_class: 'TIER_2_AUDITED_ONTOLOGY',
            description: 'Logistical weight capacity ceiling limit.',
            pardonable: true,
            max_tolerated_pardon_frequency_bps: 20.5,
            owning_entity_types: ['character'],
        }
        const result = RuleSchema.safeParse(floatBreach)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                '[FLOAT_PROHIBITED]',
            )
        }
    })

    it('validates a compliant authorizer configuration', () => {
        const authorizer: Authorizer = {
            id: 'auth_lead_architect',
            name: 'Lead World Architect',
            role: 'LEAD_ARCHITECT',
            permitted_categories: ['LOGISTICAL', 'SOCIAL'],
        }
        expect(AuthorizerSchema.safeParse(authorizer).success).toBe(true)
    })

    it('validates a compliant PardonRecord with full 64-character SHA-256 hex hash', () => {
        const pardon: PardonRecord = {
            pardon_id: 'pardon_triaged_sling_01',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep_001',
                scene_id: 'sc_culvert_siphon_01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_equip_slot_borrowing',
            authorizer_id: 'auth_lead_architect',
            justification:
                'Emergency triage permits slinging oil flask in outer garment folds.',
            granted_against_canon_hash: 'a'.repeat(64),
            injected_state_mutation: {
                vector: 'logistical',
                payload: {
                    slot_borrow: {
                        source_slot: 'held',
                        target_slot: 'worn',
                    },
                },
            },
            granted_at_epoch: 0,
        }
        expect(PardonRecordSchema.safeParse(pardon).success).toBe(true)
    })

    it('rejects pardon records with justifications shorter than 20 characters', () => {
        const shortJustification = {
            pardon_id: 'pardon_illegal_01',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep_001',
                scene_id: 'sc_culvert_siphon_01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_equip_slot_borrowing',
            authorizer_id: 'auth_lead_architect',
            justification: 'Too short.',
            granted_against_canon_hash: 'b'.repeat(64),
            granted_at_epoch: 0,
        }
        const result = PardonRecordSchema.safeParse(shortJustification)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                '[PARDON_JUSTIFICATION_TOO_SHORT]',
            )
        }
    })

    it('rejects pardon records with non-hexadecimal or truncated canon hashes', () => {
        const invalidHash = {
            pardon_id: 'pardon_illegal_02',
            target: {
                series_slug: 'under-the-floorboards',
                episode_id: 'ep_001',
                scene_id: 'sc_culvert_siphon_01',
                entity_id: 'char_wart',
            },
            rule_id: 'rule_equip_slot_borrowing',
            authorizer_id: 'auth_lead_architect',
            justification:
                'Valid justification length provided for principled audit.',
            granted_against_canon_hash: 'not-a-valid-sha256-hex-hash',
            granted_at_epoch: 0,
        }
        const result = PardonRecordSchema.safeParse(invalidHash)
        expect(result.success).toBe(false)
        if (!result.success) {
            expect(result.error.issues[0].message).toContain(
                '[INVALID_CANON_HASH]',
            )
        }
    })
})
