import { LoreModel } from '../lore.model.js'
import LoreBit from '../fce/lore.bit.js'
import State from '../../99.core/state.js'

const lore = {
    list: async () => {
        return { models: [] as any[] }
    },
}

export const initLore = (cpy: LoreModel, bal: LoreBit, ste: State) => {}

export const updateLore = (cpy: LoreModel, bal: LoreBit, ste: State) => {
    bal.slv({ intBit: { idx: 'update-lore' } })
    return cpy
}

export const testLore = (cpy: LoreModel, bal: LoreBit, ste: State) => {
    bal.slv({ mytBit: { idx: 'test-lore', val: 1 } })
    return cpy
}

export const listLore = async (cpy: LoreModel, bal: LoreBit, ste: State) => {
    bal.slv({ mytBit: { idx: 'test-lore', val: 1 } })
    return cpy
}
