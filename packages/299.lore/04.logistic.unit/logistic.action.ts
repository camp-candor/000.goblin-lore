import type { Action } from '../99.core/interface/action.interface.js'
import type LogisticBit from './fce/logistic.bit.js'

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

export const VERIFY_HAND_SATURATION = '[Logistic action] Verify Hand Saturation'
export class VerifyHandSaturation implements Action {
    readonly type = VERIFY_HAND_SATURATION
    constructor(public bale: LogisticBit) {}
}

export const ALLOCATE_EQUIP_SLOT = '[Logistic action] Allocate Equip Slot'
export class AllocateEquipSlot implements Action {
    readonly type = ALLOCATE_EQUIP_SLOT
    constructor(public bale: LogisticBit) {}
}

export const ASSERT_MASS_CONSERVATION =
    '[Logistic action] Assert Mass Conservation'
export class AssertMassConservation implements Action {
    readonly type = ASSERT_MASS_CONSERVATION
    constructor(public bale: LogisticBit) {}
}

export const RECONCILE_RETIRED_POSSESSIONS =
    '[Logistic action] Reconcile Retired Possessions'
export class ReconcileRetiredPossessions implements Action {
    readonly type = RECONCILE_RETIRED_POSSESSIONS
    constructor(public bale: LogisticBit) {}
}

export const RETIRE_CANONICAL_ENTITY =
    '[Logistic action] Retire Canonical Entity'
export class RetireCanonicalEntity implements Action {
    readonly type = RETIRE_CANONICAL_ENTITY
    constructor(public bale: LogisticBit) {}
}

export type Actions =
    | InitLogistic
    | UpdateLogistic
    | VerifyHandSaturation
    | AllocateEquipSlot
    | AssertMassConservation
    | ReconcileRetiredPossessions
    | RetireCanonicalEntity
