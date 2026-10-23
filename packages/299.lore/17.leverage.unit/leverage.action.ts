import { Action } from '../99.core/interface/action.interface'
import LeverageBit from './fce/leverage.bit'
import BeliefRecordBit from './fce/beliefRecord.bit'

export const INIT_LEVERAGE = '[Leverage action] Init Leverage'
export class InitLeverage implements Action {
    readonly type = INIT_LEVERAGE
    constructor(public bale: LeverageBit) {}
}

export const UPDATE_LEVERAGE = '[Leverage action] Update Leverage'
export class UpdateLeverage implements Action {
    readonly type = UPDATE_LEVERAGE
    constructor(public bale: LeverageBit) {}
}

export const INDEX_LEVERAGE_DIRECTORY =
    '[Leverage action] Index Leverage Directory'
export class IndexLeverageDirectory implements Action {
    readonly type = INDEX_LEVERAGE_DIRECTORY
    constructor(public bale: LeverageBit) {}
}

export const VERIFY_LEVERAGE_INTEGRITY =
    '[Leverage action] Verify Leverage Integrity'
export class VerifyLeverageIntegrity implements Action {
    readonly type = VERIFY_LEVERAGE_INTEGRITY
    constructor(public bale: LeverageBit) {}
}

export const SPEND_LEVERAGE_STRINGS = '[Leverage action] Spend Leverage Strings'
export class SpendLeverageStrings implements Action {
    readonly type = SPEND_LEVERAGE_STRINGS
    constructor(public bale: LeverageBit) {}
}

export const EVALUATE_BELIEF_DIVERGENCE =
    '[Leverage action] Evaluate Belief Divergence'
export class EvaluateBeliefDivergence implements Action {
    readonly type = EVALUATE_BELIEF_DIVERGENCE
    constructor(public bale: BeliefRecordBit) {}
}

export type Actions =
    | InitLeverage
    | UpdateLeverage
    | IndexLeverageDirectory
    | VerifyLeverageIntegrity
    | SpendLeverageStrings
    | EvaluateBeliefDivergence
