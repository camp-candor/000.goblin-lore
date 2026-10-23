import type { Action } from '../99.core/interface/action.interface'
import type TraumaBit from './fce/trauma.bit'
import type { SensoryAcuityInput } from './val/sensory.val'
import type { VocalDspModifierInput } from './val/vocalDsp.val'
import type { SomaticDeltaInput } from './val/somaticDelta.val'

export const INIT_TRAUMA = '[Trauma action] Init Trauma'
export class InitTrauma implements Action<TraumaBit> {
    readonly type = INIT_TRAUMA
    constructor(public bale: TraumaBit) {}
}

export const UPDATE_TRAUMA = '[Trauma action] Update Trauma'
export class UpdateTrauma implements Action<TraumaBit> {
    readonly type = UPDATE_TRAUMA
    constructor(public bale: TraumaBit) {}
}

export const CONFIGURE_SENSORY_ACUITY =
    '[Trauma action] Configure Sensory Acuity'
export class ConfigureSensoryAcuity implements Action<
    TraumaBit<SensoryAcuityInput>
> {
    readonly type = CONFIGURE_SENSORY_ACUITY
    constructor(public bale: TraumaBit<SensoryAcuityInput>) {}
}

export const CONFIGURE_VOCAL_DSP = '[Trauma action] Configure Vocal DSP'
export class ConfigureVocalDsp implements Action<
    TraumaBit<VocalDspModifierInput>
> {
    readonly type = CONFIGURE_VOCAL_DSP
    constructor(public bale: TraumaBit<VocalDspModifierInput>) {}
}

export const RESOLVE_SOMATIC_DELTA = '[Trauma action] Resolve Somatic Delta'
export class ResolveSomaticDelta implements Action<
    TraumaBit<SomaticDeltaInput>
> {
    readonly type = RESOLVE_SOMATIC_DELTA
    constructor(public bale: TraumaBit<SomaticDeltaInput>) {}
}

export type Actions =
    | InitTrauma
    | UpdateTrauma
    | ConfigureSensoryAcuity
    | ConfigureVocalDsp
    | ResolveSomaticDelta
