import { SchemaModel } from '../schema.model.js'
import type SchemaBit from '../fce/schema.bit.js'
import type State from '../../99.core/state.js'

export const initSchema = (
    cpy: SchemaModel,
    bal: SchemaBit,
    ste?: State,
): SchemaModel => {
    cpy.idx = bal.idx || '26.schema'
    if (bal.slv) {
        bal.slv({ scmBit: { idx: 'init-schema', val: 0 } })
    }
    return cpy
}

export const updateSchema = (
    cpy: SchemaModel,
    bal: SchemaBit,
    ste?: State,
): SchemaModel => {
    if (bal.slv) {
        bal.slv({ scmBit: { idx: 'update-schema', val: 0 } })
    }
    return cpy
}
