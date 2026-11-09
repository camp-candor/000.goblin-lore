/**
 * packages/299.lore/98.menu.unit/menu.reduce.ts
 *
 * Pure reducer switchboard for 98.menu.unit using clone-deep isolation.
 */

import clone from 'clone-deep'
import * as Act from './menu.action.js'
import * as Buzz from './menu.buzzer.js'
import { MenuModel } from './menu.model.js'
import type { Actions } from './menu.action.js'
import type State from '../99.core/state.js'

export function reducer(
    model: MenuModel = new MenuModel(),
    act: Actions,
    state?: State,
): MenuModel {
    switch (act.type) {
        case Act.INIT_MENU:
            Buzz.initMenu(clone(model), act.bale, state!)
            return model

        case Act.UPDATE_MENU:
            Buzz.updateMenu(clone(model), act.bale, state!)
            return model

        case Act.SOMATIC_HUB_MENU: {
            const cpy = clone(model)
            Buzz.openSomaticDspHub(cpy, act.bale, state!)
            return cpy
        }

        case Act.EXECUTE_SOMATIC_CHOICE:
            if (state?.hunt) {
                void Buzz.dispatchSomaticChoice(act.bale.dat.choiceId, state)
            }
            return model

        case Act.OPEN_COMPILE_MENU: {
            const cpy = clone(model)
            Buzz.openCompileMenu(cpy, act.bale, state!)
            return cpy
        }

        case Act.TRIGGER_COMPILE_ACTION: {
            const cpy = clone(model)
            Buzz.triggerCompileAction(cpy, act.bale, state!)
            return cpy
        }

        case Act.OPEN_GENESIS_MENU: {
            const cpy = clone(model)
            void Buzz.runSeriesGenesisMenu(cpy, act.bale, state!)
            return cpy
        }
        case Act.OPEN_SCAFFOLD_MENU: {
            const cpy = clone(model)
            void Buzz.runEntityScaffoldMenu(cpy, act.bale, state!)
            return cpy
        }
        case Act.OPEN_RETIREMENT_MENU: {
            const cpy = clone(model)
            void Buzz.runEntityRetirementMenu(cpy, act.bale, state!)
            return cpy
        }
        case Act.OPEN_HEALTH_MENU: {
            const cpy = clone(model)
            void Buzz.runCorpusHealthMenu(cpy, act.bale, state!)
            return cpy
        }
        case Act.OPEN_ERRATA_MENU: {
            const cpy = clone(model)
            void Buzz.runErrataMenu(cpy, act.bale, state!)
            return cpy
        }

        default:
            return model
    }
}

export default reducer
