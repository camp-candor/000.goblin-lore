import type { Action } from '../99.core/interface/action.interface.js'
import type LocomotionBit from './fce/locomotion.bit.js'

export const INIT_LOCOMOTION = '[Locomotion action] Init Locomotion'
export class InitLocomotion implements Action {
    readonly type = INIT_LOCOMOTION
    constructor(public bale: LocomotionBit) {}
}

export const UPDATE_LOCOMOTION = '[Locomotion action] Update Locomotion'
export class UpdateLocomotion implements Action {
    readonly type = UPDATE_LOCOMOTION
    constructor(public bale: LocomotionBit) {}
}

export const VALIDATE_LOCOMOTION = '[Locomotion action] Validate Locomotion'
export class ValidateLocomotion implements Action {
    readonly type = VALIDATE_LOCOMOTION
    constructor(public bale: LocomotionBit) {}
}

export type Actions = InitLocomotion | UpdateLocomotion | ValidateLocomotion
