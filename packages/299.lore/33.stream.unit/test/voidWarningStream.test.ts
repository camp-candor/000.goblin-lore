import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    getVoidWarningPayload,
    DEFAULT_VOID_WARNING_LINES,
} from '../buz/voidWarningStream.buzz.js'
import { StreamModel } from '../stream.model.js'
import { reducer } from '../stream.reduce.js'
import * as Act from '../stream.action.js'

describe('33.stream.unit - voidWarningStream', () => {
    beforeEach(() => {
        delete (globalThis as any).LIBRARY
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
    })

    it('generates the exact canonical 2-line void warning payload', () => {
        const lines = getVoidWarningPayload()
        expect(lines).toHaveLength(2)
        expect(lines[0]).toBe(
            '>> [WARN] No series found in series/. Create one first.',
        )
        expect(lines[1]).toBe(
            '>> [LOCK] Dispatch Lockout Engaged at T_0 ($0.00 spend).',
        )
    })

    it('strictly adheres to pure 7-bit ASCII with zero multi-byte emojis', () => {
        const lines = getVoidWarningPayload()
        for (const line of lines) {
            expect(/^[\x20-\x7E]+$/.test(line)).toBe(true)
        }
    })

    it('updates StreamModel state and resolves callback in headless mode', async () => {
        const initialModel = new StreamModel()
        let callbackPayload: any = null

        const action = new Act.StreamVoidWarning({
            idx: 'test-stream-void',
            slv: (res: any) => {
                callbackPayload = res
            },
        })

        const updatedModel = await reducer(initialModel, action)

        expect(updatedModel.lastEmittedWarning).toEqual([
            ...DEFAULT_VOID_WARNING_LINES,
        ])
        expect(updatedModel.warningCount).toBe(1)
        expect(callbackPayload?.stmBit?.val).toBe(2)
        expect(callbackPayload?.stmBit?.lst).toEqual([
            ...DEFAULT_VOID_WARNING_LINES,
        ])
        expect(callbackPayload?.stmBit?.dat?.targetChannel).toBe('cns00')
    })

    it('supports custom warning lines override via bal.lst', async () => {
        const initialModel = new StreamModel()
        const customLines = [
            '>> [WARN] Custom void scenario.',
            '>> [LOCK] Interlocked.',
        ]

        const action = new Act.StreamVoidWarning({
            idx: 'test-custom-stream',
            lst: customLines,
        })

        const updatedModel = await reducer(initialModel, action)

        expect(updatedModel.lastEmittedWarning).toEqual(customLines)
        expect(updatedModel.warningCount).toBe(1)
    })

    it('routes diagnostic messages to global.LIBRARY.hunt when curses environment is present', async () => {
        const mockHunt = vi.fn().mockResolvedValue({ cnsBit: { val: 1 } })
        ;(globalThis as any).LIBRARY = { hunt: mockHunt }

        const initialModel = new StreamModel()
        const action = new Act.StreamVoidWarning({
            idx: 'test-with-library',
        })

        await reducer(initialModel, action)

        expect(mockHunt).toHaveBeenCalledTimes(2)
        expect(mockHunt).toHaveBeenNthCalledWith(
            1,
            '[Console action] Update Console',
            {
                idx: 'cns00',
                src: '>> [WARN] No series found in series/. Create one first.',
            },
        )
        expect(mockHunt).toHaveBeenNthCalledWith(
            2,
            '[Console action] Update Console',
            {
                idx: 'cns00',
                src: '>> [LOCK] Dispatch Lockout Engaged at T_0 ($0.00 spend).',
            },
        )
    })
})
