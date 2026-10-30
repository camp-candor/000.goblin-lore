/**
 * packages/299.lore/98.menu.unit/menu.reduce.ts
 *
 * Pure reducer switchboard for 98.menu.unit using clone-deep isolation.
 */

import clone from 'clone-deep'
import * as Act from './menu.action'
import * as Buzz from './menu.buzzer'
import { MenuModel } from './menu.model'
import type { Actions } from './menu.action'
import type State from '../99.core/state'

export const reducer = (
    model: MenuModel = new MenuModel(),
    act: Actions,
    state?: State,
): MenuModel => {
    const cpy: MenuModel = clone(model, true)

    switch (act.type) {
        case Act.INIT_MENU:
            return Buzz.initMenu(cpy, act.bale, state!)

        case Act.UPDATE_MENU:
            Buzz.updateMenu(cpy, act.bale, state!)
            return cpy

        default:
            return cpy
    }
}

export default reducer
