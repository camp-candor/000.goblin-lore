import clone from 'clone-deep'
import * as Act from './gear.action'
import { GearModel } from './gear.model'
import * as Buzz from './gear.buzzer'
import State from '../99.core/state'

export function reducer(
    model: GearModel = new GearModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_GEAR:
            return Buzz.initGear(clone(model), act.bale, state!)
        case Act.UPDATE_GEAR:
            return Buzz.updateGear(clone(model), act.bale, state!)
        case Act.REGISTER_POSSESSION_DOSSIER:
            return Buzz.registerPossessionDossierBuzz(
                clone(model),
                act.bale as any,
                state!,
            )
        case Act.RESOLVE_CHARACTER_GEAR:
            return Buzz.resolveCharacterGearBuzz(
                clone(model),
                act.bale as any,
                state!,
            )
        case Act.AUDIT_FLEET_GEAR:
            return Buzz.auditFleetGearBuzz(clone(model), act.bale, state!)
        default:
            return model
    }
}
