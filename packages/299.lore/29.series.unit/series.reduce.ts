import clone from 'clone-deep'
import * as Act from './series.action.js'
import { SeriesModel } from './series.model.js'
import * as Buzz from './series.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: SeriesModel = new SeriesModel(),
    act: Act.Actions,
    state?: State,
): SeriesModel {
    const cpy = clone(model)
    switch (act.type) {
        case Act.INIT_SERIES:
            return Buzz.initSeries(cpy, act.bale, state!)
        case Act.UPDATE_SERIES:
            return Buzz.updateSeries(cpy, act.bale, state!)
        case Act.RESOLVE_ARCHETYPE:
            return Buzz.resolveArchetype(cpy, act.bale, state!)
        default:
            return cpy
    }
}
