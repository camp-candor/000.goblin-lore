import { EntityModel } from '../entity.model.js'
import type EntityBit from '../fce/entity.bit.js'
import type State from '../../99.core/state.js'

export const initEntity = (
    cpy: EntityModel,
    bal: EntityBit,
    ste?: State,
): EntityModel => {
    cpy.idx = bal.idx || '09.entity'
    if (bal.slv) {
        bal.slv({ entBit: { idx: 'init-entity', val: 0 } })
    }
    return cpy
}

export const updateEntity = (
    cpy: EntityModel,
    bal: EntityBit,
    ste?: State,
): EntityModel => {
    if (bal.slv) {
        bal.slv({ entBit: { idx: 'update-entity', val: 0 } })
    }
    return cpy
}
