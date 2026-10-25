/**
 * packages/299.lore/03.laws.unit/laws.action.ts
 * Action definitions for 03.laws.unit including Scaffolding Interview.
 */
import type { Action } from '../99.core/interface/action.interface'
import type LawsBit from './fce/laws.bit'
import type LawsScaffoldBit from './fce/lawsScaffold.bit'

export const INIT_LAWS = '[Laws action] Init Laws'
export class InitLaws implements Action {
    readonly type = INIT_LAWS
    constructor(public bale: LawsBit) {}
}

export const UPDATE_LAWS = '[Laws action] Update Laws'
export class UpdateLaws implements Action {
    readonly type = UPDATE_LAWS
    constructor(public bale: LawsBit) {}
}

export const SCAFFOLD_WORLD_WIZARD = '[Laws action] Scaffold World Wizard'
export class ScaffoldWorldWizard implements Action {
    readonly type = SCAFFOLD_WORLD_WIZARD
    constructor(public bale: LawsScaffoldBit) {}
}

export type Actions = InitLaws | UpdateLaws | ScaffoldWorldWizard
