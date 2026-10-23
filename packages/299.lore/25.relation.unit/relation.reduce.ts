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
        case Act.INIT_RELATION:
            return Buzz.initRelation(clone(model), act.bale, state!)
        case Act.UPDATE_RELATION:
            return Buzz.updateRelation(clone(model), act.bale, state!)
        case Act.REGISTER_RELATION_PROFILE:
            return Buzz.registerRelationProfileBuzz(
                clone(model),
                act.bale,
                state!,
            )
        case Act.RESOLVE_DYADIC_ATTITUDE:
            return Buzz.resolveDyadicAttitudeBuzz(
                clone(model),
                act.bale as any,
                state!,
            )
        case Act.BUILD_EPISTEMIC_PROMPT:
            return Buzz.buildEpistemicPromptBuzz(clone(model), act.bale, state!)
        default:
            return model
    }
}
