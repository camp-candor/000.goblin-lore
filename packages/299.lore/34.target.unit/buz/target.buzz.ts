import { TargetModel } from '../target.model.js'
import type TargetBit from '../fce/target.bit.js'
import type State from '../../99.core/state.js'

export const initTarget = (cpy: TargetModel, bal: TargetBit, ste?: State): TargetModel => {
  cpy.idx = bal.idx || '34.target'
  if (bal.slv) {
    bal.slv({ tarBit: { idx: 'init-target', val: 0 } })
  }
  return cpy
}

export const updateTarget = (cpy: TargetModel, bal: TargetBit, ste?: State): TargetModel => {
  if (bal.slv) {
    bal.slv({ tarBit: { idx: 'update-target', val: 0 } })
  }
  return cpy
}
