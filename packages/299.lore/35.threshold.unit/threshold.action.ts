import { Action } from '../99.core/interface/action.interface.js'
import type ThresholdBit from './fce/postBreak.bit.js'
import type { ThresholdEvaluationInput } from './val/postBreak.val.js'

export const INIT_THRESHOLD = '[Threshold action] Init Threshold'
export class InitThreshold implements Action {
    readonly type = INIT_THRESHOLD
    constructor(public bale: ThresholdBit) {}
}

export const UPDATE_THRESHOLD = '[Threshold action] Update Threshold'
export class UpdateThreshold implements Action {
    readonly type = UPDATE_THRESHOLD
    constructor(public bale: ThresholdBit) {}
}

export const EVALUATE_POST_BREAK_THRESHOLD =
    '[Threshold action] Evaluate Post Break Threshold'
export class EvaluatePostBreakThreshold implements Action {
    readonly type = EVALUATE_POST_BREAK_THRESHOLD
    constructor(
        public bale: ThresholdBit & {
            dat: {
                input: ThresholdEvaluationInput
                activeAcousticProfile?: any
                currentAttenuationTokens?: string[]
            }
        },
    ) {}
}

export type Actions =
    InitThreshold | UpdateThreshold | EvaluatePostBreakThreshold
