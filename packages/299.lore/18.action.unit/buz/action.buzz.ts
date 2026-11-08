import { ActionModel } from '../action.model.js'
import type ActionBit from '../fce/action.bit.js'
import type State from '../../99.core/state.js'

export const initAction = (
    cpy: ActionModel,
    bal: ActionBit,
    ste?: State,
): ActionModel => {
    cpy.idx = bal.idx || '18.action'
    if (bal.slv) {
        bal.slv({ actBit: { idx: 'init-action', val: 0 } })
    }
    return cpy
}

export const updateAction = (
    cpy: ActionModel,
    bal: ActionBit,
    ste?: State,
): ActionModel => {
    if (bal.slv) {
        bal.slv({ actBit: { idx: 'update-action', val: 0 } })
    }
    return cpy
}
