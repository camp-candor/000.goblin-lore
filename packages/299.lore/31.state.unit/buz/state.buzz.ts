import { StateModel } from '../state.model.js'
import type StateBit from '../fce/state.bit.js'
import type State from '../../99.core/state.js'

export const initState = (
    cpy: StateModel,
    bal: StateBit,
    ste?: State,
): StateModel => {
    cpy.idx = bal.idx || '31.state'
    if (bal.slv) {
        bal.slv({ steBit: { idx: 'init-state', val: 0 } })
    }
    return cpy
}

export const updateState = (
    cpy: StateModel,
    bal: StateBit,
    ste?: State,
): StateModel => {
    if (bal.slv) {
        bal.slv({ steBit: { idx: 'update-state', val: 0 } })
    }
    return cpy
}
