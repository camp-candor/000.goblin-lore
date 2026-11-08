import { CatalystModel } from '../catalyst.model.js'
import type CatalystBit from '../fce/catalyst.bit.js'
import type State from '../../99.core/state.js'

export const initCatalyst = (
    cpy: CatalystModel,
    bal: CatalystBit,
    ste?: State,
): CatalystModel => {
    cpy.idx = bal.idx || '42.catalyst'
    if (bal.slv) {
        bal.slv({ ctlBit: { idx: 'init-catalyst', val: 0 } })
    }
    return cpy
}

export const updateCatalyst = (
    cpy: CatalystModel,
    bal: CatalystBit,
    ste?: State,
): CatalystModel => {
    if (bal.slv) {
        bal.slv({ ctlBit: { idx: 'update-catalyst', val: 0 } })
    }
    return cpy
}
