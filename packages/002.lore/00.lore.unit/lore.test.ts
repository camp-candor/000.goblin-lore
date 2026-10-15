import { describe, it, expect, vi } from 'vitest'
import { initLore } from './buz/lore.buzz.js'
import { LoreModel } from './lore.model.js'

describe('lore', () => {
    it('should initialize lore', () => {
        const model = new LoreModel()
        const state = {
            hunt: vi.fn().mockResolvedValue({}),
            dispatch: vi.fn(),
        } as any

        const slv = vi.fn()
        const bal = { idx: 'test', slv } as any

        // Check if initLore is a function and can be called
        expect(typeof initLore).toBe('function')

        const result = initLore(model, bal, state)
        expect(result).toBe(model)
        //expect(slv).toHaveBeenCalledWith({ intBit: { idx: 'init-lore' } });
    })

    it('should wake up the lore if url is provided', async () => {
        const model = new LoreModel()
        const state = {} as any
        const slv = vi.fn()
        const bal = { idx: 'test', slv } as any

        const urllore = 'https://zero00-lore.onrender.com/api/lore/test'

        const mockResponselore = { status: 'lore-awake' }

        const globalFetch = vi
            .spyOn(global, 'fetch')
            .mockImplementation((url) => {
                if (url === urllore) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve(mockResponselore),
                    } as any)
                }
                return Promise.reject(new Error('Unknown URL'))
            })

        initLore(model, bal, state)

        // Wait for the promise in initLore to resolve
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(globalFetch).toHaveBeenCalledWith(urllore)
        expect(slv).toHaveBeenCalledWith({
            intBit: {
                idx: 'init-lore',
                dat: {
                    lore: mockResponselore,
                },
            },
        })

        globalFetch.mockRestore()
    })

    it('should handle fetch errors', async () => {
        const model = new LoreModel()
        const state = {} as any
        const slv = vi.fn()
        const bal = { idx: 'test', slv } as any

        const urllore = 'https://zero00-lore.onrender.com/api/lore/test'

        const errorMessage = 'Network error'
        const globalFetch = vi
            .spyOn(global, 'fetch')
            .mockImplementation((url) => {
                if (url === urllore) {
                    return Promise.reject(new Error(errorMessage))
                }
                return Promise.resolve({
                    ok: true,
                    json: async () => ({}),
                } as any)
            })

        initLore(model, bal, state)

        // Wait for the promise in initLore to resolve
        await new Promise((resolve) => setTimeout(resolve, 0))

        expect(globalFetch).toHaveBeenCalledWith(urllore)

        expect(slv).toHaveBeenCalledWith({
            intBit: { idx: 'init-lore-err', dat: errorMessage },
        })

        globalFetch.mockRestore()
    })
})
