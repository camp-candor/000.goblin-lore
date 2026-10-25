import { Action } from '../99.core/interface/action.interface'
import GrievanceBit from './fce/grievance.bit'

// Grievance actions

export const INIT_GRIEVANCE = '[Grievance action] Init Grievance'
export class InitGrievance implements Action {
    readonly type = INIT_GRIEVANCE
    constructor(public bale: GrievanceBit) {}
}

import type GrievanceScaffoldBit from './fce/grievanceScaffold.bit'

export const UPDATE_GRIEVANCE = '[Grievance action] Update Grievance'
export class UpdateGrievance implements Action {
    readonly type = UPDATE_GRIEVANCE
    constructor(public bale: GrievanceBit) {}
}

export const SCAFFOLD_GRIEVANCE_WIZARD = '[Grievance action] Scaffold Grievance Wizard';
export class ScaffoldGrievanceWizard implements Action {
  readonly type = SCAFFOLD_GRIEVANCE_WIZARD;
  constructor(public bale: GrievanceScaffoldBit) {}
}

export type Actions = InitGrievance | UpdateGrievance | ScaffoldGrievanceWizard
