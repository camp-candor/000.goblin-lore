import { ParanoiaModel } from '../paranoia.model.js'
import type ParanoiaBit from '../fce/paranoia.bit.js'
import type State from '../../99.core/state.js'

export const initParanoia = (cpy: ParanoiaModel, bal: ParanoiaBit, ste?: State): ParanoiaModel => {
  cpy.idx = bal.idx || '20.paranoia'
  if (bal.slv) {
    bal.slv({ parBit: { idx: 'init-paranoia', val: 0 } })
  }
  return cpy
}

export const updateParanoia = (cpy: ParanoiaModel, bal: ParanoiaBit, ste?: State): ParanoiaModel => {
  if (bal.slv) {
    bal.slv({ parBit: { idx: 'update-paranoia', val: 0 } })
  }
  return cpy
}
