import clone from 'clone-deep'
import * as Act from './target.action.js'
import { TargetModel } from './target.model.js'
import * as Buzz from './target.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: TargetModel = new TargetModel(),
    act: Act.Actions,
    state?: State,
): TargetModel {
    const cpy = clone(model)
    switch (act.type) {
        case Act.INIT_TARGET:
            return Buzz.initTarget(cpy, act.bale, state as any)
        case Act.UPDATE_TARGET:
            return Buzz.updateTarget(cpy, act.bale, state as any)
        case Act.SELECT_TARGET_SERIES:
            Buzz.bindActiveSeries(cpy, act.bale, state as any)
            return cpy
        default:
            return cpy
    }
}
