import clone from 'clone-deep'
import * as Act from './relation.action'
import { RelationModel } from './relation.model'
import * as Buzz from './relation.buzzer'
import State from '../99.core/state'

export function reducer(
    model: RelationModel = new RelationModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_RELATION:
            return Buzz.updateRelation(clone(model), act.bale, state)

        case Act.INIT_RELATION:
            return Buzz.initRelation(clone(model), act.bale, state)

        default:
            return model
    }
}
