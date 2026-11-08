import { WoundModel } from '../wound.model.js'
import type WoundBit from '../fce/wound.bit.js'
import type State from '../../99.core/state.js'

export const initWound = (
    cpy: WoundModel,
    bal: WoundBit,
    ste?: State,
): WoundModel => {
    cpy.idx = bal.idx || '40.wound'
    if (bal.slv) {
        bal.slv({ wndBit: { idx: 'init-wound', val: 0 } })
    }
    return cpy
}

export const updateWound = (
    cpy: WoundModel,
    bal: WoundBit,
    ste?: State,
): WoundModel => {
    if (bal.slv) {
        bal.slv({ wndBit: { idx: 'update-wound', val: 0 } })
    }
    return cpy
}
