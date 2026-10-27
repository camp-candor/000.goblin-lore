import { describe, it, expect } from 'vitest'
import { KineticVerbEnum } from '../39.verbs.unit/fce/verbs.schema.js'
import { SomaticConditionSchema } from '../37.trauma.unit/fce/condition.schema.js'
import {
    SomaticVectorSchema,
    SomaticVector,
} from '../02.character.unit/fce/somatic.schema.js'
import {
    deriveSomaticMask,
    evaluateMotorActionsFeasibility,
} from '../19.locomotion.unit/buz/locomotion.buzz.js'

describe('Phase 2 - Somatic Biomechanical State Vector System', () => {
    describe('Level 2: Strict Zod Contract & Quantization Fuzzing', () => {
        it('enforces zero-drift basis-point bounds on severity_bp and somatic_strain_bp', () => {
            // Float rejection on severity_bp
            expect(() =>
                SomaticConditionSchema.parse({
                    id: 'cond_pain',
                    locus: 'TORSO',
                    severity_bp: 5000.5,
                    impairment_penalty_arms: 0,
                    impairment_penalty_legs: 0,
                }),
            ).toThrowError(/\[FLOAT_PROHIBITED\]/)

            // Float rejection on somatic_strain_bp
            expect(() =>
                SomaticVectorSchema.parse({
                    arms_available: 2,
                    legs_available: 2,
                    locomotion_tier: 'BIPEDAL_NIMBLE',
                    somatic_strain_bp: 12.34,
                }),
            ).toThrowError(/\[FLOAT_PROHIBITED\]/)

            // Out of bounds (> 10000 or < 0)
            expect(() =>
                SomaticConditionSchema.parse({
                    id: 'cond_pain',
                    locus: 'TORSO',
                    severity_bp: 10001,
                    impairment_penalty_arms: 0,
                    impairment_penalty_legs: 0,
                }),
            ).toThrowError(/\[OUT_OF_BOUNDS\]/)

            expect(() =>
                SomaticConditionSchema.parse({
                    id: 'cond_pain',
                    locus: 'TORSO',
                    severity_bp: -1,
                    impairment_penalty_arms: 0,
                    impairment_penalty_legs: 0,
                }),
            ).toThrowError(/\[OUT_OF_BOUNDS\]/)
        })

        it('rejects unauthorized properties with .strict() mode', () => {
            expect(() =>
                SomaticVectorSchema.parse({
                    arms_available: 2,
                    legs_available: 2,
                    locomotion_tier: 'BIPEDAL_NIMBLE',
                    somatic_strain_bp: 500,
                    hallucinated_field: 'bypass',
                }),
            ).toThrowError(/unrecognized_keys/)

            expect(() =>
                SomaticConditionSchema.parse({
                    id: 'cond_pain',
                    locus: 'TORSO',
                    severity_bp: 500,
                    impairment_penalty_arms: 0,
                    impairment_penalty_legs: 0,
                    hallucinated_field: 'bypass',
                }),
            ).toThrowError(/unrecognized_keys/)
        })

        it('rejects unregistered kinetic verbs', () => {
            expect(() =>
                SomaticConditionSchema.parse({
                    id: 'cond_flight',
                    locus: 'TORSO',
                    severity_bp: 100,
                    impairment_penalty_arms: 0,
                    impairment_penalty_legs: 0,
                    added_banned_verbs: ['FLY' as any],
                }),
            ).toThrow()

            expect(() =>
                SomaticVectorSchema.parse({
                    arms_available: 2,
                    legs_available: 2,
                    locomotion_tier: 'BIPEDAL_NIMBLE',
                    somatic_strain_bp: 0,
                    banned_verbs: ['TELEPORT' as any],
                }),
            ).toThrow()

            expect(() => KineticVerbEnum.parse('HOVER')).toThrow()
        })
    })

    describe('Level 3: Adversarial Biomechanical SAT & Locomotion Derivations', () => {
        it('applies severed limb / amputation cascade', () => {
            const wartVector: SomaticVector = {
                character_id: 'char_wart',
                arms_available: 2,
                legs_available: 2,
                locomotion_tier: 'BIPEDAL_NIMBLE',
                somatic_strain_bp: 500,
                conditions: [
                    {
                        id: 'cond_brachial_plexus_severed_left',
                        locus: 'LEFT_ARM',
                        severity_bp: 8000,
                        impairment_penalty_arms: 1,
                        impairment_penalty_legs: 0,
                        added_banned_verbs: [],
                    },
                ],
                banned_verbs: [],
            }

            const mask = deriveSomaticMask(wartVector)
            expect(mask.effectiveArms).toBe(1)

            const bimanualVerbs = [
                'BIMANUAL_LIFT',
                'STRANGLE',
                'CLIMB',
                'TWO_HANDED_AIM',
                'BIMANUAL_BRACE',
            ]
            for (const verb of bimanualVerbs) {
                expect(mask.compiledBannedVerbs).toContain(verb)
            }

            const feasibility = evaluateMotorActionsFeasibility(mask, [
                'BIMANUAL_LIFT',
            ])
            expect(feasibility).toEqual({
                valid: false,
                forbiddenActions: ['BIMANUAL_LIFT'],
            })

            const allowedFeasibility = evaluateMotorActionsFeasibility(mask, [
                'POUR_OUT',
                'SNIFF',
            ])
            expect(allowedFeasibility).toEqual({
                valid: true,
                forbiddenActions: [],
            })
        })

        it('enforces locomotion degradation invariant on leg impairment', () => {
            const injuredVector: SomaticVector = {
                arms_available: 2,
                legs_available: 2,
                locomotion_tier: 'BIPEDAL_NIMBLE',
                somatic_strain_bp: 1200,
                conditions: [
                    {
                        id: 'cond_crushed_femur',
                        locus: 'LEFT_LEG',
                        severity_bp: 6000,
                        impairment_penalty_arms: 0,
                        impairment_penalty_legs: 1,
                        added_banned_verbs: [],
                    },
                ],
                banned_verbs: [],
            }

            const mask = deriveSomaticMask(injuredVector)
            expect(mask.effectiveLegs).toBe(1)
            expect(mask.derivedLocomotionTier).toBe('BIPEDAL_LIMPING')
            expect(mask.compiledBannedVerbs).toContain('SPRINT')
            expect(mask.compiledBannedVerbs).toContain('VAULT')
            expect(mask.compiledBannedVerbs).toContain('LEAP')
        })

        it('clamps sessile / slithering zero-limb locomotion', () => {
            const leglessVector: SomaticVector = {
                arms_available: 2,
                legs_available: 0,
                locomotion_tier: 'BIPEDAL_NIMBLE',
                somatic_strain_bp: 3000,
                conditions: [],
                banned_verbs: [],
            }

            const mask1 = deriveSomaticMask(leglessVector)
            expect(mask1.derivedLocomotionTier).toBe('CRAWLWAY_SLITHER')
            expect(mask1.compiledBannedVerbs).toContain('SCUTTLE')
            expect(mask1.compiledBannedVerbs).toContain('SPRINT')
            expect(mask1.compiledBannedVerbs).toContain('VAULT')
            expect(mask1.compiledBannedVerbs).toContain('LEAP')

            const immobileVector: SomaticVector = {
                arms_available: 0,
                legs_available: 0,
                locomotion_tier: 'BIPEDAL_NIMBLE',
                somatic_strain_bp: 9000,
                conditions: [],
                banned_verbs: [],
            }

            const mask2 = deriveSomaticMask(immobileVector)
            expect(mask2.derivedLocomotionTier).toBe('IMMOBILE')
            expect(mask2.compiledBannedVerbs).toContain('CRAWL')
            expect(mask2.compiledBannedVerbs).toContain('SLITHER')
            expect(mask2.compiledBannedVerbs).toContain('LIMP')
        })

        it('clamps negative capacity underflow to zero', () => {
            const severeVector: SomaticVector = {
                arms_available: 2,
                legs_available: 2,
                locomotion_tier: 'BIPEDAL_NIMBLE',
                somatic_strain_bp: 4500,
                conditions: [
                    {
                        id: 'cond_arm_1',
                        locus: 'LEFT_ARM',
                        severity_bp: 5000,
                        impairment_penalty_arms: 1,
                        impairment_penalty_legs: 0,
                        added_banned_verbs: [],
                    },
                    {
                        id: 'cond_arm_2',
                        locus: 'RIGHT_ARM',
                        severity_bp: 5000,
                        impairment_penalty_arms: 2,
                        impairment_penalty_legs: 0,
                        added_banned_verbs: [],
                    },
                ],
                banned_verbs: [],
            }

            const mask = deriveSomaticMask(severeVector)
            expect(mask.effectiveArms).toBe(0)
            expect(mask.effectiveArms).toBeGreaterThanOrEqual(0)
        })
    })
})
