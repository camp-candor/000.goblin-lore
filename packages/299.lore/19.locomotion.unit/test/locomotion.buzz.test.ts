import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LocomotionModel } from '../locomotion.model.js'
import {
    initLocomotion,
    updateLocomotion,
    validateLocomotion,
} from '../buz/locomotion.buzz.js'
import { reducer } from '../locomotion.reduce.js'
import {
    ValidateLocomotion,
    InitLocomotion,
    UpdateLocomotion,
} from '../locomotion.action.js'

describe('19.locomotion.unit: Locomotion Unit Buzzer State Dispatch', () => {
    let mockState: any

    beforeEach(() => {
        mockState = {
            hunt: vi.fn().mockResolvedValue({}),
            dispatch: vi.fn(),
        }
    })

    it('initializes locomotion model cleanly without stubs or debugger halts', () => {
        const model = new LocomotionModel()
        const slv = vi.fn()

        const result = initLocomotion(
            model,
            { idx: 'init_test', slv },
            mockState,
        )

        expect(result).toBeDefined()
        expect(result.locomotionBitList).toEqual([])
        expect(result.locomotionBits).toEqual({})
        expect(slv).toHaveBeenCalledWith({
            locomotionBit: {
                idx: 'init_test',
                val: 1,
                dat: { initialized: true },
            },
        })
    })

    it('updates locomotion model and resolves bal.slv', () => {
        const model = new LocomotionModel()
        const slv = vi.fn()

        const result = updateLocomotion(
            model,
            { idx: 'update_test', slv },
            mockState,
        )

        expect(result).toBeDefined()
        expect(slv).toHaveBeenCalledWith({
            locomotionBit: {
                idx: 'update_test',
                val: 1,
            },
        })
    })

    it('validates canonical baseline, records profile in model, and logs telemetry to cns00', async () => {
        const model = new LocomotionModel()
        const slv = vi.fn()

        await validateLocomotion(
            model,
            {
                idx: 'val_bipedal_hunched',
                dat: { baseline: 'bipedal_hunched' },
                slv,
            },
            mockState,
        )

        expect(model.locomotionBits['bipedal_hunched']).toBeDefined()
        expect(model.locomotionBits['bipedal_hunched'].max_velocity_bps).toBe(
            8000,
        )
        expect(
            model.locomotionBits['bipedal_hunched'].default_banned_verbs,
        ).toContain('sprint')

        expect(slv).toHaveBeenCalledWith({
            locomotionBit: {
                idx: 'val_bipedal_hunched',
                val: 1,
                dat: {
                    baseline: 'bipedal_hunched',
                    profile: model.locomotionBits['bipedal_hunched'],
                    isValid: true,
                },
            },
        })

        expect(mockState.hunt).toHaveBeenCalledWith(
            '[Console action] Update Console',
            expect.objectContaining({
                idx: 'cns00',
                src: expect.stringContaining(
                    'Baseline validated: bipedal_hunched',
                ),
            }),
        )
    })

    it('negative control: rejects unindexed baseline and emits fail-closed error payload', async () => {
        const model = new LocomotionModel()
        const slv = vi.fn()

        await validateLocomotion(
            model,
            {
                idx: 'val_invalid',
                dat: { baseline: 'flying_quadcopter' },
                slv,
            },
            mockState,
        )

        expect(model.locomotionBits['flying_quadcopter']).toBeUndefined()
        expect(slv).toHaveBeenCalledWith({
            locomotionBit: {
                idx: 'val_invalid',
                val: 0,
                dat: {
                    baseline: 'flying_quadcopter',
                    isValid: false,
                    error: expect.stringContaining(
                        '[INVALID_LOCOMOTION_BASELINE]',
                    ),
                },
            },
        })

        expect(mockState.hunt).toHaveBeenCalledWith(
            '[Console action] Update Console',
            expect.objectContaining({
                idx: 'cns00',
                src: expect.stringContaining('[LOCOMOTION REJECTED]'),
            }),
        )
    })

    it('negative control: rejects empty or missing baseline payload', async () => {
        const model = new LocomotionModel()
        const slv = vi.fn()

        await validateLocomotion(
            model,
            {
                idx: 'val_missing',
                dat: {},
                slv,
            },
            mockState,
        )

        expect(slv).toHaveBeenCalledWith({
            locomotionBit: {
                idx: 'val_missing',
                val: 0,
                dat: {
                    baseline: undefined,
                    isValid: false,
                    error: expect.stringContaining(
                        '[LOCOMOTION_BASELINE_REQUIRED]',
                    ),
                },
            },
        })
    })

    it('routes actions through reducer and preserves model immutability via clone-deep', async () => {
        const initialModel = new LocomotionModel()
        const slv = vi.fn()

        const action = new ValidateLocomotion({
            idx: 'red_test_01',
            dat: { baseline: 'limping' },
            slv,
        })

        const updatedModel = await reducer(initialModel, action, mockState)

        expect(updatedModel).not.toBe(initialModel)
        expect(updatedModel.locomotionBits['limping']).toBeDefined()
        expect(
            updatedModel.locomotionBits['limping'].default_banned_verbs,
        ).toContain('vault')
        expect(initialModel.locomotionBits['limping']).toBeUndefined()
    })
})
