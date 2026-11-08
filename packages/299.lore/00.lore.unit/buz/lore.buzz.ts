import { LoreModel } from '../lore.model.js'
import type LoreBit from '../fce/lore.bit.js'
import type State from '../../99.core/state.js'

export const initLore = (
    cpy: LoreModel,
    bal: LoreBit,
    ste?: State,
): LoreModel => {
    cpy.idx = bal.idx || '00.lore'
    if (bal.slv) {
        bal.slv({ lorBit: { idx: 'init-lore', val: 0, dat: cpy } })
    }
    return cpy
}

export const updateLore = (
    cpy: LoreModel,
    bal: LoreBit,
    ste?: State,
): LoreModel => {
    if (bal.slv) {
        bal.slv({ lorBit: { idx: 'update-lore', val: 0, dat: cpy } })
    }
    return cpy
}

export const testLore = (
    cpy: LoreModel,
    bal: LoreBit,
    ste?: State,
): LoreModel => {
    if (bal.slv) {
        bal.slv({ lorBit: { idx: 'test-lore', val: 1 } })
    }
    return cpy
}
