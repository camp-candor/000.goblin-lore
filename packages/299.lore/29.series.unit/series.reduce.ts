import clone from 'clone-deep'
import * as Act from './series.action.js'
import { SeriesModel } from './series.model.js'
import * as Buzz from './series.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: SeriesModel = new SeriesModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_SERIES:
            return Buzz.initSeries(clone(model), act.bale, state as State)

        case Act.UPDATE_SERIES:
            return Buzz.updateSeries(clone(model), act.bale, state as State)

        case Act.RESOLVE_ARCHETYPE:
            return Buzz.resolveArchetype(clone(model), act.bale, state as State)

        case Act.CHECK_SERIES_SLUG_AVAILABILITY:
            return Buzz.checkSeriesSlugAvailabilityBuzz(
                clone(model),
                act.bale,
                state as State,
            )

        default:
            return model
    }
}
