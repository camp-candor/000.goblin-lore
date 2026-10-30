import clone from 'clone-deep'
import * as Act from './menu.action.js'
import { MenuModel } from './menu.model.js'
import * as Buzz from './menu.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: MenuModel = new MenuModel(),
    act: Act.Actions,
    state?: State,
): any {
    const cpy = clone(model, true)

    switch (act.type) {
        case Act.INIT_MENU:
            return Buzz.initMenu(cpy, act.bale, state as State)

        case Act.UPDATE_MENU:
            return Buzz.updateMenu(cpy, act.bale, state as State)

        case Act.EXECUTE_MENU_CHOICE:
            return Buzz.executeMenuChoice(cpy, act.bale, state as State)

        default:
            return cpy
    }
}
