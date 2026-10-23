import { Action } from '../99.core/interface/action.interface'
import GearBit from './fce/gear.bit'

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

export const REGISTER_POSSESSION_DOSSIER =
    '[Gear action] Register Possession Dossier'
export class RegisterPossessionDossier implements Action {
    readonly type = REGISTER_POSSESSION_DOSSIER
    constructor(public bale: GearBit) {}
}

export const RESOLVE_CHARACTER_GEAR = '[Gear action] Resolve Character Gear'
export class ResolveCharacterGear implements Action {
    readonly type = RESOLVE_CHARACTER_GEAR
    constructor(public bale: GearBit) {}
}

export const AUDIT_FLEET_GEAR = '[Gear action] Audit Fleet Gear'
export class AuditFleetGear implements Action {
    readonly type = AUDIT_FLEET_GEAR
    constructor(public bale: GearBit) {}
}

export type Actions =
    | InitGear
    | UpdateGear
    | RegisterPossessionDossier
    | ResolveCharacterGear
    | AuditFleetGear
