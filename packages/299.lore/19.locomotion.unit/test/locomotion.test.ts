import { describe, it, expect } from 'vitest'
import {
    validateLocomotionBaseline,
    resolveLocomotionProfile,
    LOCOMOTION_PROFILES,
} from '../val/locomotion.val.js'

describe('19.locomotion.unit :: Somatic Locomotion Profile', () => {
    it('validates all canonical locomotion baselines', () => {
        for (const baseline of Object.keys(LOCOMOTION_PROFILES)) {
            expect(validateLocomotionBaseline(baseline)).toBe(baseline)
        }
    })

    it('resolves profile with integer velocity caps', () => {
        const profile = resolveLocomotionProfile('bipedal_standard')
        expect(profile.max_velocity_bps).toBe(10000)
        expect(profile.default_arms_bps).toBe(20000)
        expect(profile.default_banned_verbs).toEqual([])
    })

    it('rejects invalid baseline', () => {
        expect(() => validateLocomotionBaseline('invalid_gait')).toThrow()
    })
})
