import clone from 'clone-deep'
import * as Act from './stage.action'
import { StageModel } from './stage.model'
import * as Buzz from './stage.buzzer'
import State from '../99.core/state'

export function reducer(
    model: StageModel = new StageModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_STAGE:
            return Buzz.updateStage(clone(model), act.bale, state)

        case Act.INIT_STAGE:
            return Buzz.initStage(clone(model), act.bale, state)

        default:
            return model
    }
}
