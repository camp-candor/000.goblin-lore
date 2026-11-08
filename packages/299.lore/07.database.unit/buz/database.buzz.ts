import { DatabaseModel } from '../database.model.js'
import type DatabaseBit from '../fce/database.bit.js'
import type State from '../../99.core/state.js'

export const initDatabase = (cpy: DatabaseModel, bal: DatabaseBit, ste?: State): DatabaseModel => {
  cpy.idx = bal.idx || '07.database'
  if (bal.slv) {
    bal.slv({ datBit: { idx: 'init-database', val: 0 } })
  }
  return cpy
}

export const updateDatabase = (cpy: DatabaseModel, bal: DatabaseBit, ste?: State): DatabaseModel => {
  if (bal.slv) {
    bal.slv({ datBit: { idx: 'update-database', val: 0 } })
  }
  return cpy
}
