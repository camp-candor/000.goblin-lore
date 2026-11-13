import clone from 'clone-deep'
import * as Act from './logistic.action.js'
import { LogisticModel } from './logistic.model.js'
import * as Buzz from './logistic.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: LogisticModel = new LogisticModel(),
    act: Act.Actions,
    state?: State,
): LogisticModel {
    switch (act.type) {
        case Act.INIT_LOGISTIC:
            return Buzz.initLogistic(clone(model), act.bale, state)

        case Act.UPDATE_LOGISTIC:
            return Buzz.updateLogistic(clone(model), act.bale, state)

        case Act.VERIFY_HAND_SATURATION:
            return Buzz.verifyHandSaturationAction(
                clone(model),
                act.bale,
                state,
            )

        case Act.ALLOCATE_EQUIP_SLOT:
            return Buzz.allocateEquipSlotAction(clone(model), act.bale, state)

        case Act.ASSERT_MASS_CONSERVATION:
            return Buzz.assertMassConservationAction(
                clone(model),
                act.bale,
                state,
            )

        case Act.RECONCILE_RETIRED_POSSESSIONS:
            return Buzz.reconcileRetiredPossessionsAction(
                clone(model),
                act.bale,
                state,
            )

        case Act.RETIRE_CANONICAL_ENTITY:
            return Buzz.retireCanonicalEntityAction(
                clone(model),
                act.bale,
                state,
            ) as unknown as LogisticModel

        default:
            return model
    }
}
