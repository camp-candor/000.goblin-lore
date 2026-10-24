import { describe, it, expect } from 'vitest'
import { computeFunctionalLimbsBuzz } from '../37.trauma.unit/buz/trauma.buzz'
import { calculateHandLoadBuzz } from '../04.logistic.unit/buz/logistic.buzz'
import { validateLocomotionBaselineBuzz } from '../19.locomotion.unit/buz/locomotion.buzz'
import { enforceBannedKineticVerbsBuzz } from '../39.verbs.unit/buz/verbs.buzz'
import { evaluateSomaticSATBuzz } from '../09.entity.unit/buz/entity.buzz'

describe('Phase 3: Pre-Flight Somatic Capability Solver', () => {
    describe('Task 3.1: Net Functional Limb Calculator', () => {
        it('deducts unilateral nerve condition penalty from base arms', () => {
            const res = computeFunctionalLimbsBuzz(20000, [
                'BRACHIAL_PLEXUS_RIGHT',
            ])
            expect(res.available_arms_bp).toBe(10000)
            expect(res.total_penalty_bp).toBe(10000)
        })

        it('clamps negative limb counts to 0 bp on compound amputations', () => {
            const res = computeFunctionalLimbsBuzz(20000, [
                'AMPUTATION_LEFT_ARM',
                'AMPUTATION_RIGHT_ARM',
                'BRACHIAL_PLEXUS_LEFT',
            ])
            expect(res.available_arms_bp).toBe(0)
            expect(res.total_penalty_bp).toBe(30000)
        })
    })

    describe('Task 3.2: Hand-Capacity Equipment Slot Solver', () => {
        it('sums hand load exclusively for held slots', () => {
            const res = calculateHandLoadBuzz([
                {
                    item_id: 'item_iron_knife',
                    slot: 'held_primary',
                    occupies_hands_bp: 10000,
                },
                {
                    item_id: 'item_sack',
                    slot: 'held_offhand',
                    occupies_hands_bp: 10000,
                },
                { item_id: 'item_cloak', slot: 'worn', occupies_hands_bp: 0 },
                {
                    item_id: 'item_scrap',
                    slot: 'cached',
                    occupies_hands_bp: 10000,
                },
            ])
            expect(res.required_hands_bp).toBe(20000)
            expect(res.items_in_hands).toEqual(['item_iron_knife', 'item_sack'])
        })
    })

    describe('Task 3.3: Locomotion Gait Velocity Mapper', () => {
        it('maps limping gait to reduced velocity and mandatory bans', () => {
            const res = validateLocomotionBaselineBuzz('limping')
            expect(res.success).toBe(true)
            expect(res.profile.max_velocity_bp).toBe(4500)
            expect(res.profile.mandatory_banned_verbs).toContain('sprint')
            expect(res.profile.mandatory_banned_verbs).toContain('leap')
        })

        it('rejects unregistered locomotion strings', () => {
            const res = validateLocomotionBaselineBuzz('warp_speed_flight')
            expect(res.success).toBe(false)
            expect(res.code).toBe('INVALID_LOCOMOTION_TIER')
        })
    })

    describe('Task 3.4: Motor Limitation Negative Verb Enforcer', () => {
        it('rolls up taxonomy synonyms and merges condition bans', () => {
            const verbs = enforceBannedKineticVerbsBuzz(
                ['glare'],
                ['sprint'],
                ['AMPUTATION_LEFT_ARM'],
            )
            expect(verbs).toContain('glare')
            expect(verbs).toContain('sprint')
            expect(verbs).toContain('dash')
            expect(verbs).toContain('bolt')
            expect(verbs).toContain('bimanual_strike')
            expect(verbs).toContain('bimanual_lift')
        })
    })

    describe('Task 3.5: Unified Somatic SAT Orchestration', () => {
        it('accepts valid loadout matching available arms', () => {
            const res = evaluateSomaticSATBuzz({
                entity_id: 'char_bog',
                base_arms_bp: 20000,
                somatic_conditions: ['BRACHIAL_PLEXUS_RIGHT'],
                equipped_items: [
                    {
                        item_id: 'item_iron_knife',
                        slot: 'held_primary',
                        occupies_hands_bp: 10000,
                    },
                ],
                locomotion_baseline: 'limping',
            })
            expect(res.success).toBe(true)
            expect(res.code).toBe('OK')
            expect(res.available_arms_bp).toBe(10000)
            expect(res.required_hands_bp).toBe(10000)
        })

        it('rejects loadout when required hands exceed available arms', () => {
            const res = evaluateSomaticSATBuzz({
                entity_id: 'char_wart',
                base_arms_bp: 20000,
                somatic_conditions: ['AMPUTATION_LEFT_ARM'],
                equipped_items: [
                    {
                        item_id: 'item_iron_knife',
                        slot: 'held_primary',
                        occupies_hands_bp: 10000,
                    },
                    {
                        item_id: 'item_lantern',
                        slot: 'held_offhand',
                        occupies_hands_bp: 10000,
                    },
                ],
                locomotion_baseline: 'bipedal_standard',
            })
            expect(res.success).toBe(false)
            expect(res.code).toBe('LIMB_CAPACITY_EXCEEDED')
            expect(res.required_hands_bp).toBe(20000)
            expect(res.available_arms_bp).toBe(10000)
            expect(res.message).toContain('Limb capacity exceeded')
        })
    })
})
