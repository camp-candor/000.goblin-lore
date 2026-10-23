import clone from 'clone-deep'
import * as Act from './logistic.action'
import { LogisticModel } from './logistic.model'
import * as Buzz from './logistic.buzzer'
import State from '../99.core/state'

export function reducer(
    model: LogisticModel = new LogisticModel(),
    act: Act.Actions,
    state?: State,
) {
    const cpy = clone(model)
    switch (act.type) {
        case Act.INIT_LOGISTIC:
            return Buzz.initLogistic(cpy, act.bale, state!)
        case Act.UPDATE_LOGISTIC:
            return Buzz.updateLogistic(cpy, act.bale, state!)
        case Act.REGISTER_CHARACTER_LOGISTIC:
            return Buzz.registerCharacterLogisticBuzz(
                cpy,
                act.bale as any,
                state!,
            )
        case Act.REGISTER_POSSESSION:
            return Buzz.registerPossessionBuzz(cpy, act.bale as any, state!)
        case Act.VERIFY_HAND_SATURATION:
            return Buzz.verifyHandSaturationBuzz(cpy, act.bale as any, state!)
        case Act.TRANSFER_EQUIP_SLOT:
            return Buzz.transferEquipSlotBuzz(cpy, act.bale as any, state!)
        case Act.AUDIT_MASS_CONSERVATION:
            return Buzz.auditMassConservationBuzz(cpy, act.bale as any, state!)
        case Act.EVALUATE_PREFLIGHT_SAT:
            return Buzz.evaluatePreflightSatBuzz(cpy, act.bale as any, state!)
        default:
            return cpy
    }
}
