import { describe, it, expect } from 'vitest'
import {
    LocomotionBaselineEnum,
    LOCOMOTION_PROFILES,
    validateLocomotionBaseline,
    LocomotionProfileSchema,
} from '../val/locomotion.val.js'
import { LocomotionModel } from '../locomotion.model.js'
import { validateLocomotion } from '../buz/locomotion.buzz.js'
import { ZodError } from 'zod'

describe('19.locomotion.unit: Locomotion Baseline Enum Schema Validation', () => {
    it('validates all canonical locomotion enum members', () => {
        const expectedBaselines = [
            'bipedal_standard',
            'bipedal_hunched',
            'quadrupedal',
            'slithering',
            'brachiation',
            'sessile',
            'limping',
            'neuropathy_shuffle',
            'heavy_grounded_slog',
        ]

        for (const b of expectedBaselines) {
            expect(LocomotionBaselineEnum.parse(b)).toBe(b)
            const profile =
                LOCOMOTION_PROFILES[b as keyof typeof LOCOMOTION_PROFILES]
            expect(profile).toBeDefined()
            expect(LocomotionProfileSchema.parse(profile)).toBeDefined()
        }
    })

    it('negative control: rejects unindexed or hallucinated locomotion baselines', () => {
        const invalidBaselines = [
            'flying_winged',
            'teleporting',
            'bipedal_sprinting',
            'STAND_TALL',
            '',
        ]

        for (const b of invalidBaselines) {
            expect(() => LocomotionBaselineEnum.parse(b)).toThrow(ZodError)
        }
    })

    it('enforces anatomical upper limb capacity invariant for sessile and slithering', () => {
        const sessileProfile = validateLocomotionBaseline('sessile')
        expect(sessileProfile.default_arms_bps).toBe(0)
        expect(sessileProfile.default_banned_verbs).toContain('bimanual_lift')

        const slitheringProfile = validateLocomotionBaseline('slithering')
        expect(slitheringProfile.default_arms_bps).toBe(0)
        expect(slitheringProfile.default_banned_verbs).toContain('sprint')
    })

    it('compiles negative kinetic verb masks for limping and neuropathy_shuffle', () => {
        const limpingProfile = validateLocomotionBaseline('limping')
        expect(limpingProfile.default_banned_verbs).toEqual(
            expect.arrayContaining(['sprint', 'vault', 'leap', 'scramble']),
        )
        expect(limpingProfile.max_velocity_bps).toBe(5000)

        const shuffleProfile = validateLocomotionBaseline('neuropathy_shuffle')
        expect(shuffleProfile.default_banned_verbs).toEqual(
            expect.arrayContaining([
                'sprint',
                'vault',
                'leap',
                'rapid_stairs',
                'dive',
            ]),
        )
        expect(shuffleProfile.max_velocity_bps).toBe(4000)
    })

    it('executes validateLocomotion buzz handler with valid and invalid payloads', async () => {
        const model = new LocomotionModel()
        const mockState = {} as any

        let successResult: any = null
        await validateLocomotion(
            model,
            {
                idx: 'test_val_01',
                dat: { baseline: 'bipedal_hunched' },
                slv: (res) => {
                    successResult = res
                },
            },
            mockState,
        )

        expect(successResult).toBeDefined()
        expect(successResult.locomotionBit.val).toBe(1)
        expect(successResult.locomotionBit.dat.isValid).toBe(true)
        expect(successResult.locomotionBit.dat.profile.baseline).toBe(
            'bipedal_hunched',
        )

        let failResult: any = null
        await validateLocomotion(
            model,
            {
                idx: 'test_val_02',
                dat: { baseline: 'invalid_scoot' },
                slv: (res) => {
                    failResult = res
                },
            },
            mockState,
        )

        expect(failResult).toBeDefined()
        expect(failResult.locomotionBit.val).toBe(0)
        expect(failResult.locomotionBit.dat.isValid).toBe(false)
        expect(failResult.locomotionBit.dat.error).toContain(
            '[INVALID_LOCOMOTION_BASELINE]',
        )
    })
})
