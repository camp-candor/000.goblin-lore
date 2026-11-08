import { EscalationModel } from '../escalation.model.js'
import type EscalationBit from '../fce/escalation.bit.js'
import type State from '../../99.core/state.js'

export const initEscalation = (cpy: EscalationModel, bal: EscalationBit, ste?: State): EscalationModel => {
  cpy.idx = bal.idx || '10.escalation'
  if (bal.slv) {
    bal.slv({ escBit: { idx: 'init-escalation', val: 0 } })
  }
  return cpy
}

export const updateEscalation = (cpy: EscalationModel, bal: EscalationBit, ste?: State): EscalationModel => {
  if (bal.slv) {
    bal.slv({ escBit: { idx: 'update-escalation', val: 0 } })
  }
  return cpy
}
