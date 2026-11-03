import { Action } from '../99.core/interface/action.interface.js'
import type IntensityBit from './fce/algebraicDsp.bit.js'
import type { AlgebraicDspCompositionInput } from './val/algebraicDsp.val.js'

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

export const COMPOSE_ALGEBRAIC_DSP_MATRIX =
    '[Intensity action] Compose Algebraic DSP Matrix'
export class ComposeAlgebraicDspMatrix implements Action {
    readonly type = COMPOSE_ALGEBRAIC_DSP_MATRIX
    constructor(
        public bale: IntensityBit & {
            dat: AlgebraicDspCompositionInput
        },
    ) {}
}

export type Actions =
    InitIntensity | UpdateIntensity | ComposeAlgebraicDspMatrix
