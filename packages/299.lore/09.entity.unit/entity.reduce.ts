import clone from 'clone-deep'
import * as Act from './entity.action.js'
import { EntityModel } from './entity.model.js'
import * as Buzz from './entity.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: EntityModel = new EntityModel(),
    act: Act.Actions,
    state?: State,
): EntityModel {
    switch (act.type) {
        case Act.INIT_ENTITY:
            return Buzz.initEntity(clone(model), act.bale, state)

        case Act.UPDATE_ENTITY:
            return Buzz.updateEntity(clone(model), act.bale, state)

        case Act.ASSEMBLE_DUAL_RAIL_DOSSIER:
            return Buzz.assembleDualRailDossierAction(
                clone(model),
                act.bale,
                state,
            )

        case Act.RUN_ENTITY_PREFLIGHT_GATE:
            return Buzz.runEntityPreFlightGateAction(
                clone(model),
                act.bale,
                state,
            )

        default:
            return model
    }
}
