/**
 * packages/299.lore/98.menu.unit/menu.action.ts
 *
 * Action envelopes and typed constructors for Blessed terminal menu operations.
 */

import type { Action } from '../99.core/interface/action.interface'
import type MenuBit from './fce/menu.bit'

export const INIT_MENU = '[Menu Action] Init Menu'
export class InitMenu implements Action<MenuBit> {
    readonly type = INIT_MENU
    constructor(public bale: MenuBit) {}
}

export const UPDATE_MENU = '[Menu Action] Update Menu'
export class UpdateMenu implements Action<MenuBit> {
    readonly type = UPDATE_MENU
    constructor(public bale: MenuBit) {}
}

export const EXECUTE_MENU_CHOICE = '[Menu Action] Execute Menu Choice'
export class ExecuteMenuChoice implements Action<MenuBit> {
    readonly type = EXECUTE_MENU_CHOICE
    constructor(public bale: MenuBit) {}
}

export type Actions = InitMenu | UpdateMenu | ExecuteMenuChoice
