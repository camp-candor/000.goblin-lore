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

export type Actions = InitCatalyst | UpdateCatalyst
