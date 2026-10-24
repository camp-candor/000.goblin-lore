import clone from 'clone-deep'
import * as Act from './menu.action.js'
import { MenuModel } from './menu.model.js'
import * as Buzz from './menu.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: MenuModel = new MenuModel(),
    act: Act.Actions,
    state?: State,
) {
    let result: any
    switch (act.type) {
        case Act.INIT_MENU:
            result = Buzz.initMenu(clone(model), act.bale, state as any)
            break

        case Act.UPDATE_MENU:
            result = Buzz.updateMenu(clone(model), act.bale, state as any)
            break

        case Act.FACT_SCHEMA_MENU:
            result = Buzz.openFactSchemaSubmenu(
                clone(model),
                act.bale,
                state as any,
            )
            break

        case Act.OPEN_CHARACTER_DOSSIER_SUBMENU:
            result = Buzz.openCharacterDossierSubmenu(
                clone(model),
                act.bale,
                state as any,
            )
            break

        default:
            return model
    }

    if (result && typeof result.then === 'function') {
        result.idx = model.idx
        result.activeSubmenu = model.activeSubmenu
        result.lst = model.lst
        result.lastSelection = model.lastSelection
    }
    return result
}
