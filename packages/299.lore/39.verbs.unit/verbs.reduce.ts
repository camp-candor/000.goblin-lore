import clone from 'clone-deep'
import * as Act from './verbs.action'
import { VerbsModel } from './verbs.model'
import * as Buzz from './verbs.buzzer'
import State from '../99.core/state'

export function reducer(
    model: VerbsModel = new VerbsModel(),
    act: Act.Actions,
    state?: State,
): VerbsModel {
    const cpy = clone(model)
    switch (act.type) {
        case Act.INIT_VERBS:
            return Buzz.initVerbs(cpy, act.bale, state!)
        case Act.UPDATE_VERBS:
            return Buzz.updateVerbs(cpy, act.bale, state!)
        case Act.COMPILE_SOMATIC_MASK:
            return Buzz.compileSomaticMaskVerbs(cpy, act.bale, state!)
        case Act.ASSERT_KINETIC_VERBS:
            Buzz.assertKineticVerbs(cpy, act.bale, state!)
            return cpy
        default:
            return cpy
    }
}

export default function verbsReducer(
    state: State,
    action: Act.Actions,
    tack: VerbsModel = new VerbsModel(),
): VerbsModel {
    return reducer(tack, action, state)
}
