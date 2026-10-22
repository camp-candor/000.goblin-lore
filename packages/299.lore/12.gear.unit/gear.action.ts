import { Action } from '../99.core/interface/action.interface'
import GearBit from './fce/gear.bit'

// Gear actions

export const INIT_GEAR = '[Gear action] Init Gear'
export class InitGear implements Action {
    readonly type = INIT_GEAR
    constructor(public bale: GearBit) {}
}

export const UPDATE_GEAR = '[Gear action] Update Gear'
export class UpdateGear implements Action {
    readonly type = UPDATE_GEAR
    constructor(public bale: GearBit) {}
}

export type Actions = InitGear | UpdateGear
