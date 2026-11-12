import clone from 'clone-deep'
import * as Act from './canon.action.js'
import { CanonModel } from './canon.model.js'
import * as Buzz from './canon.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: CanonModel = new CanonModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.UPDATE_CANON:
            return Buzz.updateCanon(clone(model), act.bale, state)

        case Act.INIT_CANON:
            return Buzz.initCanon(clone(model), act.bale, state)

        case Act.RANK_RECONSIDERATION_QUEUE:
            return Buzz.rankReconsiderationQueueAction(
                clone(model),
                act.bale,
                state,
            )

        case Act.AFFIRM_STILL_GOOD:
            return Buzz.affirmStillGoodAction(clone(model), act.bale, state)

        case Act.VERIFY_TRIE_CLUE_DISJOINTNESS:
            return Buzz.verifyTrieClueDisjointnessAction(
                clone(model),
                act.bale,
                state,
            )

        default:
            return model
    }
}
