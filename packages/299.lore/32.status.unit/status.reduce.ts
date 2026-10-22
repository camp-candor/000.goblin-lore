import clone from 'clone-deep'
import * as Act from './status.action'
import { StatusModel } from './status.model'
import * as Buzz from './status.buzzer'
import State from '../99.core/state'

export function reducer(
    model: StatusModel = new StatusModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_STATUS:
            return Buzz.updateStatus(clone(model), act.bale, state)

        case Act.INIT_STATUS:
            return Buzz.initStatus(clone(model), act.bale, state)

        default:
            return model
    }
}
