import { Action } from '../99.core/interface/action.interface.js'
import type PressureMeterBit from './fce/pressureMeter.bit.js'
import type {
    PressureMeter,
    FrictionDebitEvent,
} from './val/pressureMeter.val.js'
import type { InterMeterBridgeEvaluationInput } from './val/interMeterBridge.val.js'

export const INIT_DECAY = '[Decay action] Init Decay'
export class InitDecay implements Action {
    readonly type = INIT_DECAY
    constructor(public bale: PressureMeterBit) {}
}

export const UPDATE_DECAY = '[Decay action] Update Decay'
export class UpdateDecay implements Action {
    readonly type = UPDATE_DECAY
    constructor(public bale: PressureMeterBit) {}
}

export const STEP_THERMODYNAMIC_CYCLE =
    '[Decay action] Step Thermodynamic Cycle'
export class StepThermodynamicCycle implements Action {
    readonly type = STEP_THERMODYNAMIC_CYCLE
    constructor(
        public bale: PressureMeterBit & {
            dat: {
                meter: PressureMeter
                frictionDebits?: FrictionDebitEvent[]
                tick?: number
            }
        },
    ) {}
}

export const EVALUATE_INTER_METER_BRIDGE =
    '[Decay action] Evaluate Inter Meter Bridge'
export class EvaluateInterMeterBridge implements Action {
    readonly type = EVALUATE_INTER_METER_BRIDGE
    constructor(
        public bale: PressureMeterBit & {
            dat: InterMeterBridgeEvaluationInput
        },
    ) {}
}

export type Actions =
    InitDecay | UpdateDecay | StepThermodynamicCycle | EvaluateInterMeterBridge
