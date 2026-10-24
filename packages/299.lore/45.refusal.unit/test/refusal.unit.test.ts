import { describe, it, expect, vi } from 'vitest'
import { RefusalModel } from '../refusal.model'
import { initRefusal, updateRefusal, testRefusal } from '../buz/refusal.buzz'
import { reducer } from '../refusal.reduce'
import { InitRefusal, UpdateRefusal, TestRefusal } from '../refusal.action'
import type State from '../../99.core/state'

describe('45.refusal.unit: Refusal Unit Seven-File Anatomy Registration', () => {
    const mockState = {} as State

    it('initRefusal resolves with { idx: "init-refusal", val: 1 }', () => {
        const model = new RefusalModel()
        const slv = vi.fn()
        const bal = { idx: 'test-init', slv }

        const result = initRefusal(model, bal, mockState)
        expect(result).toBe(model)
        expect(slv).toHaveBeenCalledWith({
            rflBit: { idx: 'init-refusal', val: 1 },
        })
    })

    it('updateRefusal resolves with payload data', () => {
        const model = new RefusalModel()
        const slv = vi.fn()
        const bal = { idx: 'test-update', dat: { key: 'val' }, slv }

        const result = updateRefusal(model, bal, mockState)
        expect(result).toBe(model)
        expect(slv).toHaveBeenCalledWith({
            rflBit: { idx: 'update-refusal', dat: { key: 'val' } },
        })
    })

    it('testRefusal resolves with { idx: "test-refusal", val: 1 }', () => {
        const model = new RefusalModel()
        const slv = vi.fn()
        const bal = { idx: 'test-ping', slv }

        const result = testRefusal(model, bal, mockState)
        expect(result).toBe(model)
        expect(slv).toHaveBeenCalledWith({
            rflBit: { idx: 'test-refusal', val: 1 },
        })
    })

    it('state mutations are non-destructive and use clone-deep in reducer', () => {
        const initialModel = new RefusalModel()
        initialModel.refusalBitList.push({ idx: 'sentinel' })

        const slv = vi.fn()
        const action = new UpdateRefusal({
            idx: 'test-update',
            dat: { sample: 'payload' },
            slv,
        })

        const nextModel = reducer(initialModel, action, mockState)

        expect(nextModel).not.toBe(initialModel)
        expect(nextModel.refusalBitList).toEqual(initialModel.refusalBitList)
        expect(slv).toHaveBeenCalledWith({
            rflBit: { idx: 'update-refusal', dat: { sample: 'payload' } },
        })
    })

    it('reducer handles InitRefusal and TestRefusal actions cleanly', () => {
        const model = new RefusalModel()
        const slvInit = vi.fn()
        const initAct = new InitRefusal({ idx: 'init-test', slv: slvInit })
        reducer(model, initAct, mockState)
        expect(slvInit).toHaveBeenCalledWith({
            rflBit: { idx: 'init-refusal', val: 1 },
        })

        const slvTest = vi.fn()
        const testAct = new TestRefusal({ idx: 'test-test', slv: slvTest })
        reducer(model, testAct, mockState)
        expect(slvTest).toHaveBeenCalledWith({
            rflBit: { idx: 'test-refusal', val: 1 },
        })
    })
})
