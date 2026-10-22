import clone from 'clone-deep'
import * as Act from './catalyst.action'
import { CatalystModel } from './catalyst.model'
import * as Buzz from './catalyst.buzzer'
import State from '../99.core/state'

export function reducer(
    model: CatalystModel = new CatalystModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_CATALYST:
            return Buzz.updateCatalyst(clone(model), act.bale, state)

        case Act.INIT_CATALYST:
            return Buzz.initCatalyst(clone(model), act.bale, state)

        default:
            return model
    }
}
