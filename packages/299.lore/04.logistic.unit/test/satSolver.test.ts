import { describe, it, expect } from 'vitest'
import { evaluatePreflightSat } from '../buz/satSolver.buzz'
import { PreflightSatEvaluationInput } from '../val/satSolver.val'

describe('04.logistic.unit :: Hand Saturation Pre-Flight SAT Solver', () => {
    it('satisfies an unencumbered intact actor performing a single-handed action', () => {
        const input: PreflightSatEvaluationInput = {
            somatic_profile: {
                actor_id: 'char_bog',
                locomotion_baseline: 'bipedal_standard',
                left_arm_state: 'INTACT',
                right_arm_state: 'INTACT',
                banned_kinetic_verbs: [],
            },
            currently_held_items: [],
            proposed_action: {
                action_id: 'act_grasp_knife',
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                demanded_handedness: 'EITHER',
                required_kinetic_verbs: ['grasp'],
            },
        }

        const result = evaluatePreflightSat(input)
        expect(result.is_satisfiable).toBe(true)
        expect(result.conflict_code).toBe('NONE')
        expect(result.total_arms_available_bps).toBe(20000)
        expect(result.total_hands_demanded_bps).toBe(10000)
    })

    it('rejects an action requiring a left hand when the left arm is amputated', () => {
        const input: PreflightSatEvaluationInput = {
            somatic_profile: {
                actor_id: 'char_wart',
                locomotion_baseline: 'limping',
                left_arm_state: 'AMPUTATED',
                right_arm_state: 'INTACT',
                banned_kinetic_verbs: ['sprint', 'vault'],
            },
            currently_held_items: [],
            proposed_action: {
                action_id: 'act_operate_left_valve',
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                demanded_handedness: 'LEFT',
                required_kinetic_verbs: ['turn'],
            },
        }

        const result = evaluatePreflightSat(input)
        expect(result.is_satisfiable).toBe(false)
        expect(result.conflict_code).toBe('PER_LIMB_AMPUTATION_BREACH')
        expect(result.reason).toContain('Left arm is unavailable')
    })

    it('permits a right-handed action for an amputee actor whose right arm remains intact', () => {
        const input: PreflightSatEvaluationInput = {
            somatic_profile: {
                actor_id: 'char_wart',
                locomotion_baseline: 'limping',
                left_arm_state: 'AMPUTATED',
                right_arm_state: 'INTACT',
                banned_kinetic_verbs: [],
            },
            currently_held_items: [],
            proposed_action: {
                action_id: 'act_operate_right_lever',
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                demanded_handedness: 'RIGHT',
                required_kinetic_verbs: ['pull'],
            },
        }

        const result = evaluatePreflightSat(input)
        expect(result.is_satisfiable).toBe(true)
        expect(result.conflict_code).toBe('NONE')
        expect(result.total_arms_available_bps).toBe(10000)
    })

    it('rejects a bimanual action for an actor with only 1 intact limb', () => {
        const input: PreflightSatEvaluationInput = {
            somatic_profile: {
                actor_id: 'char_wart',
                locomotion_baseline: 'bipedal_standard',
                left_arm_state: 'AMPUTATED',
                right_arm_state: 'INTACT',
                banned_kinetic_verbs: [],
            },
            currently_held_items: [],
            proposed_action: {
                action_id: 'act_bimanual_valve_wheel',
                occupies_hands: 2,
                occupies_hands_bps: 20000,
                demanded_handedness: 'BIMANUAL',
                required_kinetic_verbs: ['turn_wheel'],
            },
        }

        const result = evaluatePreflightSat(input)
        expect(result.is_satisfiable).toBe(false)
        expect(result.conflict_code).toBe('HAND_CAPACITY_BREACH')
    })

    it('rejects an action requiring a banned kinetic verb from somatic trauma', () => {
        const input: PreflightSatEvaluationInput = {
            somatic_profile: {
                actor_id: 'char_spleen',
                locomotion_baseline: 'limping',
                left_arm_state: 'INTACT',
                right_arm_state: 'INTACT',
                banned_kinetic_verbs: ['vault', 'sprint', 'dual_wield'],
            },
            currently_held_items: [],
            proposed_action: {
                action_id: 'act_vault_counter',
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                demanded_handedness: 'EITHER',
                required_kinetic_verbs: ['vault'],
            },
        }

        const result = evaluatePreflightSat(input)
        expect(result.is_satisfiable).toBe(false)
        expect(result.conflict_code).toBe('KINETIC_MOTOR_BREACH')
        expect(result.reason).toContain('attempted banned motor verbs [vault]')
    })

    it('clamps arm capacity to zero for sessile organisms regardless of limb states', () => {
        const input: PreflightSatEvaluationInput = {
            somatic_profile: {
                actor_id: 'char_barnacle_cluster',
                locomotion_baseline: 'sessile',
                left_arm_state: 'INTACT',
                right_arm_state: 'INTACT',
                banned_kinetic_verbs: [],
            },
            currently_held_items: [],
            proposed_action: {
                action_id: 'act_catch_scrap',
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                demanded_handedness: 'EITHER',
                required_kinetic_verbs: ['grasp'],
            },
        }

        const result = evaluatePreflightSat(input)
        expect(result.is_satisfiable).toBe(false)
        expect(result.conflict_code).toBe('HAND_CAPACITY_BREACH')
        expect(result.total_arms_available_bps).toBe(0)
    })
})
