import { describe, it, expect } from 'vitest'
import { StatusModel } from '../status.model.js'
import { reducer } from '../status.reduce.js'
import * as Act from '../status.action.js'

describe('32.status.unit - Dispatch Lockout Flag Model', () => {
    it('initializes with dispatchLockEngaged: true and COLD_BOOT_VOID_STATE', () => {
        const model = new StatusModel()
        expect(model.dispatchLockEngaged).toBe(true)
        expect(model.isVoidState).toBe(true)
        expect(model.lockReason).toBe('COLD_BOOT_VOID_STATE')
        expect(model.lockHistory).toHaveLength(1)
        expect(model.lockHistory[0].reason).toBe('COLD_BOOT_VOID_STATE')
        expect(model.lockHistory[0].engaged).toBe(true)
    })

    it('handles disengaging the dispatch lockout cleanly', async () => {
        const initialModel = new StatusModel()
        let callbackPayload: any = null

        const action = new Act.SetDispatchLockout({
            idx: 'test-unlock',
            val: 0,
            src: 'SERIES_BOUND_AND_SEALED',
            slv: (res: any) => {
                callbackPayload = res
            },
        })

        const updatedModel = await reducer(initialModel, action)

        expect(updatedModel.dispatchLockEngaged).toBe(false)
        expect(updatedModel.lockReason).toBeNull()
        expect(updatedModel.lockHistory).toHaveLength(2)
        expect(updatedModel.lockHistory[1].engaged).toBe(false)
        expect(updatedModel.lockHistory[1].reason).toBe(
            'SERIES_BOUND_AND_SEALED',
        )

        expect(callbackPayload?.statusBit?.val).toBe(0)
        expect(callbackPayload?.statusBit?.src).toBe('SERIES_BOUND_AND_SEALED')
    })

    it('handles re-engaging the dispatch lockout with a specific reason', async () => {
        const initialModel = new StatusModel()
        initialModel.dispatchLockEngaged = false
        initialModel.lockReason = null

        const action = new Act.SetDispatchLockout({
            idx: 'test-relock',
            val: 1,
            src: 'UNCOMPILED_CANON_DRIFT',
        })

        const updatedModel = await reducer(initialModel, action)

        expect(updatedModel.dispatchLockEngaged).toBe(true)
        expect(updatedModel.lockReason).toBe('UNCOMPILED_CANON_DRIFT')
        expect(updatedModel.lockHistory).toHaveLength(2)
        expect(updatedModel.lockHistory[1].engaged).toBe(true)
        expect(updatedModel.lockHistory[1].reason).toBe(
            'UNCOMPILED_CANON_DRIFT',
        )
    })

    it('reads current lockout status without mutating model state', async () => {
        const model = new StatusModel()
        let readPayload: any = null

        const action = new Act.ReadDispatchLockout({
            idx: 'test-read',
            slv: (res: any) => {
                readPayload = res
            },
        })

        const returnedModel = await reducer(model, action)

        expect(returnedModel).toEqual(model)
        expect(readPayload?.statusBit?.val).toBe(1)
        expect(readPayload?.statusBit?.src).toBe('COLD_BOOT_VOID_STATE')
        expect(readPayload?.statusBit?.dat?.dispatchLockEngaged).toBe(true)
    })
})
