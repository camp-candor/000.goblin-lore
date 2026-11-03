import { Action } from '../99.core/interface/action.interface.js'
import type ParanoiaClockBit from './fce/paranoiaClock.bit.js'
import type {
    ParanoiaMeterState,
    AcousticTransientEvent,
} from './val/paranoiaClock.val.js'

export const INIT_PARANOIA = '[Paranoia action] Init Paranoia'
export class InitParanoia implements Action {
    readonly type = INIT_PARANOIA
    constructor(public bale: ParanoiaClockBit) {}
}

export const UPDATE_PARANOIA = '[Paranoia action] Update Paranoia'
export class UpdateParanoia implements Action {
    readonly type = UPDATE_PARANOIA
    constructor(public bale: ParanoiaClockBit) {}
}

export const APPLY_ACOUSTIC_TRANSIENT_IMPULSE =
    '[Paranoia action] Apply Acoustic Transient Impulse'
export class ApplyAcousticTransientImpulse implements Action {
    readonly type = APPLY_ACOUSTIC_TRANSIENT_IMPULSE
    constructor(
        public bale: ParanoiaClockBit & {
            dat: {
                clock: ParanoiaMeterState
                acousticEvent: AcousticTransientEvent
                epoch?: number
            }
        },
    ) {}
}

export const DECAY_PARANOIA_TICK = '[Paranoia action] Decay Paranoia Tick'
export class DecayParanoiaTick implements Action {
    readonly type = DECAY_PARANOIA_TICK
    constructor(
        public bale: ParanoiaClockBit & {
            dat: {
                clock: ParanoiaMeterState
                epoch?: number
            }
        },
    ) {}
}

export const COMPUTE_PARANOIA_PITCH_FLUTTER =
    '[Paranoia action] Compute Paranoia Pitch Flutter'
export class ComputeParanoiaPitchFlutter implements Action {
    readonly type = COMPUTE_PARANOIA_PITCH_FLUTTER
    constructor(
        public bale: ParanoiaClockBit & {
            dat: {
                clock: ParanoiaMeterState
            }
        },
    ) {}
}

export type Actions =
    | InitParanoia
    | UpdateParanoia
    | ApplyAcousticTransientImpulse
    | DecayParanoiaTick
    | ComputeParanoiaPitchFlutter
