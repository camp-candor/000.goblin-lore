import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
    formatUnboundBannerPayload,
    UNBOUND_HUD_LINES,
} from '../buz/unboundBanner.buzz.js'
import { StatusModel } from '../status.model.js'
import { reducer } from '../status.reduce.js'
import * as Act from '../status.action.js'

describe('32.status.unit - formatUnboundBanner', () => {
    beforeEach(() => {
        delete (globalThis as any).LIBRARY
    })

    afterEach(() => {
        delete (globalThis as any).LIBRARY
    })

    it('generates exactly four lines matching the canonical void specification', () => {
        const lines = formatUnboundBannerPayload()
        expect(lines).toHaveLength(4)
        expect(lines[0]).toBe('ACTIVE SERIES : [NONE (UNBOUND)]')
        expect(lines[1]).toBe('CANON STATUS  : VOID STATE (T0=$0.00)')
        expect(lines[2]).toBe(
            'ROOT MERKLE   : 0000000000000000000000000000000000000000000000000000000000000000',
        )
        expect(lines[3]).toBe('DISPATCH LOCK : [!] ENGAGED')
    })

    it('strictly adheres to 7-bit ASCII characters with zero multi-byte emojis', () => {
        const lines = formatUnboundBannerPayload()
        for (const line of lines) {
            expect(/^[\x20-\x7E]+$/.test(line)).toBe(true)
        }
    })

    it('updates StatusModel state through reducer dispatch in headless mode', async () => {
        const initialModel = new StatusModel()
        initialModel.hudLines = []

        let resolvedResult: any = null
        const action = new Act.FormatUnboundBanner({
            idx: 'test-unbound-banner',
            slv: (res: any) => {
                resolvedResult = res
            },
        })

        const updatedModel = await reducer(initialModel, action)

        expect(updatedModel.isVoidState).toBe(true)
        expect(updatedModel.dispatchLockEngaged).toBe(true)
        expect(updatedModel.activeBorderColor).toBe('amber')
        expect(updatedModel.hudLines).toEqual([...UNBOUND_HUD_LINES])
        expect(resolvedResult?.statusBit?.val).toBe(1)
        expect(resolvedResult?.statusBit?.lst).toEqual([...UNBOUND_HUD_LINES])
    })

    it('dispatches update to global.LIBRARY.hunt when curses environment is present', async () => {
        const mockHunt = vi.fn().mockResolvedValue({ trmBit: { val: 1 } })
        ;(globalThis as any).LIBRARY = { hunt: mockHunt }

        const initialModel = new StatusModel()
        const action = new Act.FormatUnboundBanner({
            idx: 'test-with-library',
        })

        await reducer(initialModel, action)

        expect(mockHunt).toHaveBeenCalledTimes(1)
        expect(mockHunt).toHaveBeenCalledWith(
            '[Terminal action] Update Terminal',
            expect.objectContaining({
                idx: 'trm00',
                val: 1,
                lst: [...UNBOUND_HUD_LINES],
                dat: expect.objectContaining({ borderClr: 'amber' }),
            }),
        )
    })
})
