import { Action } from '../99.core/interface/action.interface'
import StageBit from './fce/stage.bit'

// Stage actions

export const INIT_STAGE = '[Stage action] Init Stage'
export class InitStage implements Action {
    readonly type = INIT_STAGE
    constructor(public bale: StageBit) {}
}

export const UPDATE_STAGE = '[Stage action] Update Stage'
export class UpdateStage implements Action {
    readonly type = UPDATE_STAGE
    constructor(public bale: StageBit) {}
}

export type Actions = InitStage | UpdateStage
