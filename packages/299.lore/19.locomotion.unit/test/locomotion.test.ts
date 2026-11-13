import { describe, it, expect } from 'vitest'
import {
    validateLocomotionBaseline,
    resolveLocomotionProfile,
    LOCOMOTION_PROFILES,
    VALID_LOCOMOTION_BASELINES,
} from '../val/locomotion.val.js'
import { validateLocomotion } from '../buz/locomotion.buzz.js'
import { reducer } from '../locomotion.reduce.js'
import { VALIDATE_LOCOMOTION } from '../locomotion.action.js'
import { LocomotionModel } from '../locomotion.model.js'

describe('19.locomotion.unit :: Somatic Locomotion Profile', () => {
    it('validates all 9 canonical locomotion baselines with integer basis points', () => {
        expect(VALID_LOCOMOTION_BASELINES).toHaveLength(9)
        for (const baseline of VALID_LOCOMOTION_BASELINES) {
            expect(validateLocomotionBaseline(baseline)).toBe(baseline)
            const profile = resolveLocomotionProfile(baseline)
            expect(Number.isInteger(profile.max_velocity_bps)).toBe(true)
            expect(Number.isInteger(profile.default_arms_bps)).toBe(true)
            expect(profile.max_velocity_bps).toBeGreaterThanOrEqual(0)
            expect(profile.max_velocity_bps).toBeLessThanOrEqual(10000)
        }
        expect(Object.keys(LOCOMOTION_PROFILES)).toHaveLength(9)
    })

    it('[Level 2 Trap] rejects unregistered locomotion baselines with ZodError', () => {
        for (const bad of [
            'teleporting',
            'flying_winged',
            '',
            'invalid_gait',
        ]) {
            expect(() => validateLocomotionBaseline(bad)).toThrow()
            expect(() =>
                reducer(new LocomotionModel(), {
                    type: VALIDATE_LOCOMOTION,
                    bale: { idx: 'bad-gait', src: bad },
                } as any),
            ).toThrow()
        }
    })

    it('[Level 2 Trap] clamps sessile and slithering upper-limb capacity to 0 bps and bans bimanual_lift', () => {
        for (const baseline of ['sessile', 'slithering'] as const) {
            const profile = resolveLocomotionProfile(baseline)
            expect(profile.default_arms_bps).toBe(0)
        }
        expect(
            resolveLocomotionProfile('slithering').default_banned_verbs,
        ).toContain('bimanual_lift')
        expect(resolveLocomotionProfile('quadrupedal').default_arms_bps).toBe(0)
        expect(
            resolveLocomotionProfile('quadrupedal').default_banned_verbs,
        ).toContain('bimanual_lift')
    })

    it('[Level 2 Trap] enforces limping and neuropathy_shuffle velocity caps and verb masks', () => {
        const limping = resolveLocomotionProfile('limping')
        expect(limping.max_velocity_bps).toBe(5000)
        expect(limping.default_banned_verbs).toEqual([
            'sprint',
            'vault',
            'leap',
            'scramble',
        ])

        const shuffle = resolveLocomotionProfile('neuropathy_shuffle')
        expect(shuffle.max_velocity_bps).toBe(4000)
        expect(shuffle.default_banned_verbs).toEqual([
            'sprint',
            'vault',
            'leap',
            'rapid_stairs',
            'dive',
        ])
    })

    it('dispatches [Locomotion action] Validate Locomotion through reducer and resolves bal.slv', () => {
        let resolved: any = null
        validateLocomotion(new LocomotionModel(), {
            idx: 'test-validate',
            src: 'neuropathy_shuffle',
            slv: (res: any) => {
                resolved = res
            },
        })
        expect(resolved?.lcmBit?.val).toBe(1)
        expect(resolved?.lcmBit?.src).toBe('neuropathy_shuffle')
        expect(resolved?.lcmBit?.dat?.profile?.max_velocity_bps).toBe(4000)
    })
})
