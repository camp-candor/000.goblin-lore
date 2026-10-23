import type { Action } from '../99.core/interface/action.interface.js'
import type WoundBit from './fce/wound.bit.js'
import type { CompoundTraumaInput } from './val/wound.val.js'

export const INIT_WOUND = '[Wound action] Init Wound'
export class InitWound implements Action<WoundBit> {
    readonly type = INIT_WOUND
    constructor(public bale: WoundBit) {}
}

export const UPDATE_WOUND = '[Wound action] Update Wound'
export class UpdateWound implements Action<WoundBit> {
    readonly type = UPDATE_WOUND
    constructor(public bale: WoundBit) {}
}

export const CLAMP_COMPOUND_TRAUMA = '[Wound action] Clamp Compound Trauma'
export class ClampCompoundTrauma implements Action<
    WoundBit<CompoundTraumaInput>
> {
    readonly type = CLAMP_COMPOUND_TRAUMA
    constructor(public bale: WoundBit<CompoundTraumaInput>) {}
}

export type Actions = InitWound | UpdateWound | ClampCompoundTrauma
