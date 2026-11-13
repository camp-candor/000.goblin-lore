import clone from 'clone-deep'
import * as Act from './status.action.js'
import { StatusModel } from './status.model.js'
import * as Buzz from './status.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: StatusModel = new StatusModel(),
    act: Act.Actions,
    state?: State,
): StatusModel {
    switch (act.type) {
        case Act.INIT_STATUS:
            return Buzz.initStatus(clone(model), act.bale, state)

        case Act.UPDATE_STATUS:
            return Buzz.updateStatus(clone(model), act.bale, state)

        case Act.EVALUATE_VOID_STATE:
            return Buzz.voidStateScan(
                clone(model),
                act.bale,
                state,
            ) as unknown as StatusModel

        default:
            return model
    }
}
