import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
    promptSeriesNameBuzz,
    OPEN_INPUT,
} from '../buz/promptSeriesName.buzz.js'
import { FALLBACK_GENESIS_INPUT_GRID } from '../buz/genesisInputGrid.buzz.js'

describe('98.menu.unit - Curses Textbox Modal Invoker', () => {
    const originalLibrary = (globalThis as any).LIBRARY

    beforeEach(() => {
        delete (globalThis as any).LIBRARY
    })

    afterEach(() => {
        if (originalLibrary !== undefined) {
            ;(globalThis as any).LIBRARY = originalLibrary
        } else {
            delete (globalThis as any).LIBRARY
        }
    })

    it('handles headless execution without LIBRARY cleanly', async () => {
        const resWithoutDefault = await promptSeriesNameBuzz()
        expect(resWithoutDefault.isHeadless).toBe(true)
        expect(resWithoutDefault.cancelled).toBe(true)
        expect(resWithoutDefault.rawName).toBe('')

        const resWithDefault = await promptSeriesNameBuzz({
            defaultName: 'wiregrass-basin',
        })
        expect(resWithDefault.isHeadless).toBe(true)
        expect(resWithDefault.cancelled).toBe(false)
        expect(resWithDefault.rawName).toBe('wiregrass-basin')
    })

    it('dispatches OPEN_INPUT to 84.input.unit and captures submitted text', async () => {
        const huntSpy = vi
            .fn()
            .mockImplementation(async (action: string, bale: any) => {
                if (action === '[Console action] Update Console') {
                    return { cnsBit: { idx: 'update-console' } }
                }
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            idx: 'update-grid',
                            dat: FALLBACK_GENESIS_INPUT_GRID,
                        },
                    }
                }
                if (action === OPEN_INPUT) {
                    return {
                        putBit: {
                            idx: 'open-input',
                            src: '  Wiregrass Basin  ',
                            val: 0,
                        },
                    }
                }
                return {}
            })

        ;(globalThis as any).LIBRARY = { hunt: huntSpy }

        const res = await promptSeriesNameBuzz()

        expect(huntSpy).toHaveBeenCalledWith(
            OPEN_INPUT,
            expect.objectContaining({
                txt: 'Enter Series Name:',
                dat: { clr0: 'black', clr1: 'yellow' },
                net: FALLBACK_GENESIS_INPUT_GRID,
            }),
        )
        expect(res.cancelled).toBe(false)
        expect(res.rawName).toBe('Wiregrass Basin')
        expect(res.isHeadless).toBe(false)
    })

    it('handles user cancellation via escape cleanly', async () => {
        const huntSpy = vi
            .fn()
            .mockImplementation(async (action: string, bale: any) => {
                if (action === '[Console action] Update Console') {
                    return { cnsBit: { idx: 'update-console' } }
                }
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            idx: 'update-grid',
                            dat: FALLBACK_GENESIS_INPUT_GRID,
                        },
                    }
                }
                if (action === OPEN_INPUT) {
                    return {
                        putBit: {
                            idx: 'open-input-cancel',
                            src: '',
                            val: -1,
                        },
                    }
                }
                return {}
            })

        ;(globalThis as any).LIBRARY = { hunt: huntSpy }

        const res = await promptSeriesNameBuzz()

        expect(res.cancelled).toBe(true)
        expect(res.rawName).toBe('')
        expect(res.isHeadless).toBe(false)
    })

    it('handles empty input submission as cancellation', async () => {
        const huntSpy = vi
            .fn()
            .mockImplementation(async (action: string, bale: any) => {
                if (action === '[Console action] Update Console') {
                    return { cnsBit: { idx: 'update-console' } }
                }
                if (action === '[Grid action] Update Grid') {
                    return {
                        grdBit: {
                            idx: 'update-grid',
                            dat: FALLBACK_GENESIS_INPUT_GRID,
                        },
                    }
                }
                if (action === OPEN_INPUT) {
                    return {
                        putBit: {
                            idx: 'open-input',
                            src: '   ',
                            val: 0,
                        },
                    }
                }
                return {}
            })

        ;(globalThis as any).LIBRARY = { hunt: huntSpy }

        const res = await promptSeriesNameBuzz()

        expect(res.cancelled).toBe(true)
        expect(res.rawName).toBe('')
    })

    it('recovers safely when LIBRARY.hunt throws', async () => {
        const huntSpy = vi.fn().mockImplementation(async (action: string) => {
            if (action === OPEN_INPUT) {
                throw new Error('TTY stream contention crash')
            }
            return {}
        })

        ;(globalThis as any).LIBRARY = { hunt: huntSpy }

        const res = await promptSeriesNameBuzz()

        expect(res.cancelled).toBe(true)
        expect(res.rawName).toBe('')
        expect(res.isHeadless).toBe(false)
    })
})
