import clone from 'clone-deep'
import * as Act from './item.action'
import { ItemModel } from './item.model'
import * as Buzz from './item.buzzer'
import State from '../99.core/state'

export function reducer(
    model: ItemModel = new ItemModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_ITEM:
            return Buzz.updateItem(clone(model), act.bale, state)

        case Act.INIT_ITEM:
            return Buzz.initItem(clone(model), act.bale, state)

        default:
            return model
    }
}
