import cloneDeep from 'clone-deep'
import * as Act from './menu.action.js'
import { MenuModel } from './menu.model.js'
import * as Buzz from './menu.buzzer.js'
import type State from '../99.core/state.js'

const clone = <T>(val: T): T => cloneDeep(val, true)

export function reducer(
    model: MenuModel = new MenuModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_MENU:
            return Buzz.updateMenu(clone(model), act.bale, state!)
        case Act.INIT_MENU:
            return Buzz.initMenu(clone(model), act.bale, state!)
        case Act.OPEN_GENESIS_MENU:
            return Buzz.openGenesisMenu(clone(model), act.bale, state!)
        case Act.OPEN_COMPILE_MENU:
            return Buzz.openCompileMenu(clone(model), act.bale, state!)
        case Act.OPEN_SCAFFOLD_MENU:
            return Buzz.runEntityScaffoldMenu(clone(model), act.bale, state)
        case Act.OPEN_RETIREMENT_MENU:
            return Buzz.runEntityRetirementMenu(clone(model), act.bale, state)
        case Act.OPEN_HEALTH_MENU:
            return Buzz.runCorpusHealthMenu(clone(model), act.bale, state)
        case Act.OPEN_HYGIENE_MENU:
            return Buzz.runHygieneMenu(clone(model), act.bale, state)
        case Act.OPEN_ERRATA_MENU:
            return Buzz.runErrataMenu(clone(model), act.bale, state)
        case Act.PUBLISH_SEALED_CANON:
            return Buzz.publishSealedCanonToFleet(
                clone(model),
                act.bale as any,
                state,
            )
        case Act.EXPORT_TOPOLOGY_MANIFEST:
            return Buzz.exportStaticTopologyManifest(
                clone(model),
                act.bale as any,
                state,
            )
        default:
            return model
    }
}

export default reducer
