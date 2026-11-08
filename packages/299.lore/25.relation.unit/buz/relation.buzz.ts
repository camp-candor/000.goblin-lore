import { RelationModel } from '../relation.model.js'
import type RelationBit from '../fce/relation.bit.js'
import type State from '../../99.core/state.js'

export const initRelation = (
    cpy: RelationModel,
    bal: RelationBit,
    ste?: State,
): RelationModel => {
    cpy.idx = bal.idx || '25.relation'
    if (bal.slv) {
        bal.slv({ rltBit: { idx: 'init-relation', val: 0 } })
    }
    return cpy
}

export const updateRelation = (
    cpy: RelationModel,
    bal: RelationBit,
    ste?: State,
): RelationModel => {
    if (bal.slv) {
        bal.slv({ rltBit: { idx: 'update-relation', val: 0 } })
    }
    return cpy
}
