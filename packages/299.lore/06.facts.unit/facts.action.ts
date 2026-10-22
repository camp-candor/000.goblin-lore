import { Action } from '../99.core/interface/action.interface'
import FactsBit from './fce/facts.bit'

// Facts actions

export const INIT_FACTS = '[Facts action] Init Facts'
export class InitFacts implements Action {
    readonly type = INIT_FACTS
    constructor(public bale: FactsBit) {}
}

export const UPDATE_FACTS = '[Facts action] Update Facts'
export class UpdateFacts implements Action {
    readonly type = UPDATE_FACTS
    constructor(public bale: FactsBit) {}
}

export type Actions = InitFacts | UpdateFacts
