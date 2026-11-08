import { ItemModel } from '../item.model.js'
import type ItemBit from '../fce/item.bit.js'
import type State from '../../99.core/state.js'

export const initItem = (
    cpy: ItemModel,
    bal: ItemBit,
    ste?: State,
): ItemModel => {
    cpy.idx = bal.idx || '15.item'
    if (bal.slv) {
        bal.slv({ itmBit: { idx: 'init-item', val: 0 } })
    }
    return cpy
}

export const updateItem = (
    cpy: ItemModel,
    bal: ItemBit,
    ste?: State,
): ItemModel => {
    if (bal.slv) {
        bal.slv({ itmBit: { idx: 'update-item', val: 0 } })
    }
    return cpy
}
