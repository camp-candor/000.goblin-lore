import { LeverageModel } from '../leverage.model.js'
import type LeverageBit from '../fce/leverage.bit.js'
import type State from '../../99.core/state.js'

export const initLeverage = (
    cpy: LeverageModel,
    bal: LeverageBit,
    ste?: State,
): LeverageModel => {
    cpy.idx = bal.idx || '17.leverage'
    if (bal.slv) {
        bal.slv({ lvrBit: { idx: 'init-leverage', val: 0 } })
    }
    return cpy
}

export const updateLeverage = (
    cpy: LeverageModel,
    bal: LeverageBit,
    ste?: State,
): LeverageModel => {
    if (bal.slv) {
        bal.slv({ lvrBit: { idx: 'update-leverage', val: 0 } })
    }
    return cpy
}
