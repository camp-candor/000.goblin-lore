/**
 * packages/299.lore/13.grievance.unit/grievance.action.ts
 * Action definitions for 13.grievance.unit including Scaffolding Interview.
 */
import type { Action } from '../99.core/interface/action.interface'
import type GrievanceBit from './fce/grievance.bit'
import type GrievanceScaffoldBit from './fce/grievanceScaffold.bit'

export const INIT_GRIEVANCE = '[Grievance action] Init Grievance'
export class InitGrievance implements Action {
    readonly type = INIT_GRIEVANCE
    constructor(public bale: GrievanceBit) {}
}

export const UPDATE_GRIEVANCE = '[Grievance action] Update Grievance'
export class UpdateGrievance implements Action {
    readonly type = UPDATE_GRIEVANCE
    constructor(public bale: GrievanceBit) {}
}

export const SCAFFOLD_GRIEVANCE_WIZARD =
    '[Grievance action] Scaffold Grievance Wizard'
export class ScaffoldGrievanceWizard implements Action {
    readonly type = SCAFFOLD_GRIEVANCE_WIZARD
    constructor(public bale: GrievanceScaffoldBit) {}
}

export type Actions = InitGrievance | UpdateGrievance | ScaffoldGrievanceWizard
