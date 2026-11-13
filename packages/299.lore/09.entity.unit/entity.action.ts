import type { Action } from '../99.core/interface/action.interface.js'
import type EntityBit from './fce/entity.bit.js'
import type EntityAssembleBit from './fce/entityAssemble.bit.js'
import type EntityPreFlightGateBit from './fce/preFlightGate.bit.js'

export const INIT_ENTITY = '[Entity action] Init Entity'
export class InitEntity implements Action {
    readonly type = INIT_ENTITY
    constructor(public bale: EntityBit) {}
}

export const UPDATE_ENTITY = '[Entity action] Update Entity'
export class UpdateEntity implements Action {
    readonly type = UPDATE_ENTITY
    constructor(public bale: EntityBit) {}
}

export const ASSEMBLE_DUAL_RAIL_DOSSIER =
    '[Entity action] Assemble Dual Rail Dossier'
export class AssembleDualRailDossier implements Action {
    readonly type = ASSEMBLE_DUAL_RAIL_DOSSIER
    constructor(public bale: EntityAssembleBit) {}
}

export const RUN_ENTITY_PREFLIGHT_GATE =
    '[Entity action] Run Entity PreFlight Gate'
export class RunEntityPreFlightGate implements Action {
    readonly type = RUN_ENTITY_PREFLIGHT_GATE
    constructor(public bale: EntityPreFlightGateBit) {}
}

export type Actions =
    InitEntity | UpdateEntity | AssembleDualRailDossier | RunEntityPreFlightGate
