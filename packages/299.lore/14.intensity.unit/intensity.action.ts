import { Action } from '../99.core/interface/action.interface'
import IntensityBit from './fce/intensity.bit'

// Intensity actions

export const INIT_INTENSITY = '[Intensity action] Init Intensity'
export class InitIntensity implements Action {
    readonly type = INIT_INTENSITY
    constructor(public bale: IntensityBit) {}
}

export const UPDATE_INTENSITY = '[Intensity action] Update Intensity'
export class UpdateIntensity implements Action {
    readonly type = UPDATE_INTENSITY
    constructor(public bale: IntensityBit) {}
}

export type Actions = InitIntensity | UpdateIntensity
