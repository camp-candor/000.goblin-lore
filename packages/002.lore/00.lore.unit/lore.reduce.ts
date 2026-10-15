import clone from 'clone-deep'
import * as Act from './lore.action.js'
import { LoreModel } from './lore.model.js'
import * as Buzz from './lore.buzzer.js'
import State from '../99.core/state.js'

export function reducer(
    model: LoreModel = new LoreModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_LORE:
            return Buzz.updateLore(clone(model), act.bale, state)

        case Act.INIT_LORE:
            return Buzz.initLore(clone(model), act.bale, state)

        case Act.TEST_LORE:
            return Buzz.testLore(clone(model), act.bale, state)

        case Act.LIST_LORE:
            return Buzz.listLore(clone(model), act.bale, state)

        default:
            return model
    }
}
