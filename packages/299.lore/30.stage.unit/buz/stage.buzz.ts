import { StageModel } from '../stage.model.js'
import type StageBit from '../fce/stage.bit.js'
import type State from '../../99.core/state.js'

export const initStage = (
    cpy: StageModel,
    bal: StageBit,
    ste?: State,
): StageModel => {
    cpy.idx = bal.idx || '30.stage'
    if (bal.slv) {
        bal.slv({ stgBit: { idx: 'init-stage', val: 0 } })
    }
    return cpy
}

export const updateStage = (
    cpy: StageModel,
    bal: StageBit,
    ste?: State,
): StageModel => {
    if (bal.slv) {
        bal.slv({ stgBit: { idx: 'update-stage', val: 0 } })
    }
    return cpy
}
