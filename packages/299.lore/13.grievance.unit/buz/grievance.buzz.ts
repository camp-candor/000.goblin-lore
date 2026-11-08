import { GrievanceModel } from '../grievance.model.js'
import type GrievanceBit from '../fce/grievance.bit.js'
import type State from '../../99.core/state.js'

export const initGrievance = (
    cpy: GrievanceModel,
    bal: GrievanceBit,
    ste?: State,
): GrievanceModel => {
    cpy.idx = bal.idx || '13.grievance'
    if (bal.slv) {
        bal.slv({ grvBit: { idx: 'init-grievance', val: 0 } })
    }
    return cpy
}

export const updateGrievance = (
    cpy: GrievanceModel,
    bal: GrievanceBit,
    ste?: State,
): GrievanceModel => {
    if (bal.slv) {
        bal.slv({ grvBit: { idx: 'update-grievance', val: 0 } })
    }
    return cpy
}
