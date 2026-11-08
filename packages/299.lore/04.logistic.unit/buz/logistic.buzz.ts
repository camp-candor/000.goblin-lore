import { LogisticModel } from '../logistic.model.js'
import type LogisticBit from '../fce/logistic.bit.js'
import type State from '../../99.core/state.js'

export const initLogistic = (
    cpy: LogisticModel,
    bal: LogisticBit,
    ste?: State,
): LogisticModel => {
    cpy.idx = bal.idx || '04.logistic'
    if (bal.slv) {
        bal.slv({ logBit: { idx: 'init-logistic', val: 0 } })
    }
    return cpy
}

export const updateLogistic = (
    cpy: LogisticModel,
    bal: LogisticBit,
    ste?: State,
): LogisticModel => {
    if (bal.slv) {
        bal.slv({ logBit: { idx: 'update-logistic', val: 0 } })
    }
    return cpy
}
