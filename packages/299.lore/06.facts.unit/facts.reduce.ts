import clone from 'clone-deep'
import * as Act from './facts.action'
import { FactsModel } from './facts.model'
import * as Buzz from './facts.buzzer'
import State from '../99.core/state'

export function reducer(
    model: FactsModel = new FactsModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_FACTS:
            return Buzz.updateFacts(clone(model), act.bale, state)

        case Act.INIT_FACTS:
            return Buzz.initFacts(clone(model), act.bale, state)

        default:
            return model
    }
}
