import { Action } from '../99.core/interface/action.interface'
import LogisticBit from './fce/logistic.bit'

export const INIT_LOGISTIC = '[Logistic action] Init Logistic'
export class InitLogistic implements Action {
    readonly type = INIT_LOGISTIC
    constructor(public bale: LogisticBit) {}
}

export const UPDATE_LOGISTIC = '[Logistic action] Update Logistic'
export class UpdateLogistic implements Action {
    readonly type = UPDATE_LOGISTIC
    constructor(public bale: LogisticBit) {}
}

export const REGISTER_CHARACTER_LOGISTIC =
    '[Logistic action] Register Character Logistic'
export class RegisterCharacterLogistic implements Action {
    readonly type = REGISTER_CHARACTER_LOGISTIC
    constructor(public bale: LogisticBit) {}
}

export const REGISTER_POSSESSION = '[Logistic action] Register Possession'
export class RegisterPossession implements Action {
    readonly type = REGISTER_POSSESSION
    constructor(public bale: LogisticBit) {}
}

export const VERIFY_HAND_SATURATION = '[Logistic action] Verify Hand Saturation'
export class VerifyHandSaturation implements Action {
    readonly type = VERIFY_HAND_SATURATION
    constructor(public bale: LogisticBit) {}
}

export const TRANSFER_EQUIP_SLOT = '[Logistic action] Transfer Equip Slot'
export class TransferEquipSlot implements Action {
    readonly type = TRANSFER_EQUIP_SLOT
    constructor(public bale: LogisticBit) {}
}

export const AUDIT_MASS_CONSERVATION =
    '[Logistic action] Audit Mass Conservation'
export class AuditMassConservation implements Action {
    readonly type = AUDIT_MASS_CONSERVATION
    constructor(public bale: LogisticBit) {}
}

export const EVALUATE_PREFLIGHT_SAT = '[Logistic action] Evaluate Preflight Sat'
export class EvaluatePreflightSat implements Action {
    readonly type = EVALUATE_PREFLIGHT_SAT
    constructor(public bale: any) {}
}

export type Actions =
    | InitLogistic
    | UpdateLogistic
    | RegisterCharacterLogistic
    | RegisterPossession
    | VerifyHandSaturation
    | TransferEquipSlot
    | AuditMassConservation
    | EvaluatePreflightSat
