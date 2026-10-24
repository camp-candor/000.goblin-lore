import clone from 'clone-deep'
import * as Act from './item.action.js'
import { ItemModel } from './item.model.js'
import * as Buzz from './item.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: ItemModel = new ItemModel(),
    act: Act.Actions,
    state?: State,
): Promise<ItemModel> | ItemModel {
    switch (act.type) {
        case Act.UPDATE_ITEM:
            return Buzz.updateItem(clone(model), act.bale, state)

        case Act.INIT_ITEM:
            return Buzz.initItem(clone(model), act.bale, state)

        case Act.SCAFFOLD_POSSESSION_WIZARD:
            return Buzz.scaffoldPossessionWizard(clone(model), act.bale, state!)

        default:
            return model
    }
}
