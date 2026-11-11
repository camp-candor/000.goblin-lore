import type { Action } from '../99.core/interface/action.interface.js'
import type MenuBit from './fce/menu.bit.js'

export const INIT_MENU = '[Menu action] Init Menu'
export class InitMenu implements Action {
    readonly type = INIT_MENU
    constructor(public bale: MenuBit) {}
}

export const UPDATE_MENU = '[Menu action] Update Menu'
export class UpdateMenu implements Action {
    readonly type = UPDATE_MENU
    constructor(public bale: MenuBit) {}
}

export const OPEN_GENESIS_MENU = '[Menu action] Open Genesis Menu'
export class OpenGenesisMenu implements Action {
    readonly type = OPEN_GENESIS_MENU
    constructor(public bale: MenuBit) {}
}

export const OPEN_COMPILE_MENU = '[Menu action] Open Compile Menu'
export class OpenCompileMenu implements Action {
    readonly type = OPEN_COMPILE_MENU
    constructor(public bale: MenuBit) {}
}

export const OPEN_SCAFFOLD_MENU = '[Menu action] Open Scaffold Menu'
export class OpenScaffoldMenu implements Action {
    readonly type = OPEN_SCAFFOLD_MENU
    constructor(public bale: MenuBit) {}
}

export const OPEN_RETIREMENT_MENU = '[Menu action] Open Retirement Menu'
export class OpenRetirementMenu implements Action {
    readonly type = OPEN_RETIREMENT_MENU
    constructor(public bale: MenuBit) {}
}

export const OPEN_HEALTH_MENU = '[Menu action] Open Health Menu'
export class OpenHealthMenu implements Action {
    readonly type = OPEN_HEALTH_MENU
    constructor(public bale: MenuBit) {}
}

export const OPEN_HYGIENE_MENU = '[Menu action] Open Hygiene Menu'
export class OpenHygieneMenu implements Action {
    readonly type = OPEN_HYGIENE_MENU
    constructor(public bale: MenuBit) {}
}

export const OPEN_ERRATA_MENU = '[Menu action] Open Errata Menu'
export class OpenErrataMenu implements Action {
    readonly type = OPEN_ERRATA_MENU
    constructor(public bale: MenuBit) {}
}

export type Actions =
    | InitMenu
    | UpdateMenu
    | OpenGenesisMenu
    | OpenCompileMenu
    | OpenScaffoldMenu
    | OpenRetirementMenu
    | OpenHealthMenu
    | OpenHygieneMenu
    | OpenErrataMenu
