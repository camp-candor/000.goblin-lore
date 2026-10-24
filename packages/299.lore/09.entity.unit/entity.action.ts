import type { Action } from '../99.core/interface/action.interface.js'
import type EntityBit from './fce/entity.bit.js'
import type HumanGateBit from './fce/humanGate.bit.js'

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

export const OPEN_HUMAN_SAVE_GATE = '[Entity action] Open Human Save Gate'
export class OpenHumanSaveGate implements Action {
    readonly type = OPEN_HUMAN_SAVE_GATE
    constructor(public bale: HumanGateBit) {}
}

export const EVALUATE_SOMATIC_SAT = 'entity/EVALUATE_SOMATIC_SAT'
export const AUDIT_ENTITY_CAPABILITY = 'entity/AUDIT_ENTITY_CAPABILITY'

export interface EvaluateSomaticSATAction {
    readonly type: typeof EVALUATE_SOMATIC_SAT
    readonly payload: unknown
}

export type Actions = InitEntity | UpdateEntity | OpenHumanSaveGate
