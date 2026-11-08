import { describe, it, expect, vi } from 'vitest'
import { initLore, updateLore, testLore } from './buz/lore.buzz.js'
import { LoreModel } from './lore.model.js'

describe('00.lore.unit :: Deterministic Core Initialization', () => {
    it('should initialize lore deterministically with code 0', () => {
        const model = new LoreModel()
        const slv = vi.fn()
        const bal = { idx: '00.lore', slv } as any

        expect(typeof initLore).toBe('function')
        const result = initLore(model, bal)
        expect(result).toBe(model)
        expect(result.idx).toBe('00.lore')
        expect(slv).toHaveBeenCalledWith({
            lorBit: { idx: 'init-lore', val: 0, dat: model },
        })
    })

    it('should update lore deterministically with code 0', () => {
        const model = new LoreModel()
        const slv = vi.fn()
        const bal = { idx: '00.lore', slv } as any

        const result = updateLore(model, bal)
        expect(result).toBe(model)
        expect(slv).toHaveBeenCalledWith({
            lorBit: { idx: 'update-lore', val: 0, dat: model },
        })
    })

    it('should test lore deterministically with code 1', () => {
        const model = new LoreModel()
        const slv = vi.fn()
        const bal = { idx: '00.lore', slv } as any

        const result = testLore(model, bal)
        expect(result).toBe(model)
        expect(slv).toHaveBeenCalledWith({
            lorBit: { idx: 'test-lore', val: 1 },
        })
    })
})
