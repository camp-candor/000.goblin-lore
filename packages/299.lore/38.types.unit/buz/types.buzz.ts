import { TypesModel } from '../types.model.js'
import type TypesBit from '../fce/types.bit.js'
import type State from '../../99.core/state.js'

export const initTypes = (
    cpy: TypesModel,
    bal: TypesBit,
    ste?: State,
): TypesModel => {
    cpy.idx = bal.idx || '38.types'
    if (bal.slv) {
        bal.slv({ typBit: { idx: 'init-types', val: 0 } })
    }
    return cpy
}

export const updateTypes = (
    cpy: TypesModel,
    bal: TypesBit,
    ste?: State,
): TypesModel => {
    if (bal.slv) {
        bal.slv({ typBit: { idx: 'update-types', val: 0 } })
    }
    return cpy
}
