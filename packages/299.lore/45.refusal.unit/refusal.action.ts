import type { Action } from '../99.core/interface/action.interface'
import type RefusalBit from './fce/refusal.bit'

// Refusal Action Enumerations
export const INIT_REFUSAL = '[Refusal action] Init Refusal'
export class InitRefusal implements Action {
    readonly type = INIT_REFUSAL
    constructor(public bale: RefusalBit) {}
}

export const UPDATE_REFUSAL = '[Refusal action] Update Refusal'
export class UpdateRefusal implements Action {
    readonly type = UPDATE_REFUSAL
    constructor(public bale: RefusalBit) {}
}

export const TEST_REFUSAL = '[Refusal action] Test Refusal'
export class TestRefusal implements Action {
    readonly type = TEST_REFUSAL
    constructor(public bale: RefusalBit) {}
}

export const VALIDATE_REFUSAL_TUPLE = '[Refusal action] Validate Refusal Tuple'
export class ValidateRefusalTuple implements Action {
    readonly type = VALIDATE_REFUSAL_TUPLE
    constructor(public bale: RefusalBit) {}
}

export const CLAMP_REFUSAL_STRAIN = '[Refusal action] Clamp Refusal Strain'
export class ClampRefusalStrain implements Action {
    readonly type = CLAMP_REFUSAL_STRAIN
    constructor(public bale: RefusalBit) {}
}

export const BIND_DISCOVERY_PROVENANCE =
    '[Refusal action] Bind Discovery Provenance'
export class BindDiscoveryProvenance implements Action {
    readonly type = BIND_DISCOVERY_PROVENANCE
    constructor(public bale: RefusalBit) {}
}

export type Actions =
    | InitRefusal
    | UpdateRefusal
    | TestRefusal
    | ValidateRefusalTuple
    | ClampRefusalStrain
    | BindDiscoveryProvenance
