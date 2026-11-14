import { Action } from '../99.core/interface/action.interface'
import CatalystBit from './fce/catalyst.bit'

// Catalyst actions

export const INIT_CATALYST = '[Catalyst action] Init Catalyst'
export class InitCatalyst implements Action {
    readonly type = INIT_CATALYST
    constructor(public bale: CatalystBit) {}
}

export const UPDATE_CATALYST = '[Catalyst action] Update Catalyst'
export class UpdateCatalyst implements Action {
    readonly type = UPDATE_CATALYST
    constructor(public bale: CatalystBit) {}
}

export const EVALUATE_CATALYST_SIGNIFICANCE =
    '[Catalyst action] Evaluate Catalyst Significance'
export class EvaluateCatalystSignificance implements Action {
    readonly type = EVALUATE_CATALYST_SIGNIFICANCE
    constructor(public bale: CatalystBit) {}
}

export const SCORE_CATALYST_EVENT = '[Catalyst action] Score Catalyst Event'
export class ScoreCatalystEvent implements Action {
    readonly type = SCORE_CATALYST_EVENT
    constructor(public bale: CatalystBit) {}
}

export const SCORE_CATALYST_BATCH = '[Catalyst action] Score Catalyst Batch'
export class ScoreCatalystBatch implements Action {
    readonly type = SCORE_CATALYST_BATCH
    constructor(public bale: CatalystBit) {}
}

export type Actions =
    | InitCatalyst
    | UpdateCatalyst
    | EvaluateCatalystSignificance
    | ScoreCatalystEvent
    | ScoreCatalystBatch
