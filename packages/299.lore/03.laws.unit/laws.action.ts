import type { Action } from '../99.core/interface/action.interface.js'
import type LawsBit from './fce/laws.bit.js'
import type PardonEvaluatorBit from './fce/pardonValidation.bit.js'
import type ErrataOperationBit from './fce/errataOperation.bit.js'

export const INIT_LAWS = '[Laws action] Init Laws'
export class InitLaws implements Action {
    readonly type = INIT_LAWS
    constructor(public bale: LawsBit) {}
}

export const UPDATE_LAWS = '[Laws action] Update Laws'
export class UpdateLaws implements Action {
    readonly type = UPDATE_LAWS
    constructor(public bale: LawsBit) {}
}

export const APPEND_ERRATA = '[Laws action] Append Errata'
export class AppendErrata implements Action {
    readonly type = APPEND_ERRATA
    constructor(public bale: ErrataOperationBit) {}
}

export const VERIFY_ERRATA = '[Laws action] Verify Errata'
export class VerifyErrata implements Action {
    readonly type = VERIFY_ERRATA
    constructor(public bale: ErrataOperationBit) {}
}

export const EVALUATE_PARDON_WAIVERS = '[Laws action] Evaluate Pardon Waivers'
export class EvaluatePardonWaivers implements Action {
    readonly type = EVALUATE_PARDON_WAIVERS
    constructor(public bale: PardonEvaluatorBit) {}
}

export type Actions =
    InitLaws | UpdateLaws | AppendErrata | VerifyErrata | EvaluatePardonWaivers
