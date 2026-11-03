/**
 * packages/299.lore/98.menu.unit/menu.action.ts
 *
 * Action envelopes and typed constructors for Blessed terminal menu operations.
 */

import type { Action } from '../99.core/interface/action.interface'
import type MenuBit from './fce/menu.bit'

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

export const EXECUTE_MENU_CHOICE = '[Menu action] Execute Menu Choice'
export class ExecuteMenuChoice implements Action {
    readonly type = EXECUTE_MENU_CHOICE
    constructor(public bale: MenuBit) {}
}

// Compile Menu Action Constants
export const OPEN_COMPILE_MENU = '[Menu action] Open Compile Menu'
export class OpenCompileMenu implements Action {
    readonly type = OPEN_COMPILE_MENU
    constructor(public bale: MenuBit) {}
}

export const TRIGGER_COMPILE_ACTION = '[Menu action] Trigger Compile Action'
export class TriggerCompileAction implements Action {
    readonly type = TRIGGER_COMPILE_ACTION
    constructor(public bale: MenuBit) {}
}

// Aliases for compatibility and checklist completeness
export const COMPILE_MENU = OPEN_COMPILE_MENU
export const RUN_COMPILE_MENU = TRIGGER_COMPILE_ACTION
export const GATE0_VERIFY_MENU = '[Compile action] Gate 0 Verification Audit'

export type Actions =
    | InitMenu
    | UpdateMenu
    | ExecuteMenuChoice
    | OpenCompileMenu
    | TriggerCompileAction
