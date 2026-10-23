import clone from 'clone-deep'
import * as Act from './escalation.action'
import { EscalationModel } from './escalation.model'
import * as Buzz from './escalation.buzzer'
import State from '../99.core/state'

export function reducer(
    model: EscalationModel = new EscalationModel(),
    act: Act.Actions,
    state?: State,
) {
    switch (act.type) {
        case Act.INIT_ESCALATION:
            return Buzz.initEscalation(clone(model), act.bale, state!)
        case Act.UPDATE_ESCALATION:
            return Buzz.updateEscalation(clone(model), act.bale, state!)
        case Act.REGISTER_CONVERSATIONAL_PROFILE:
            return Buzz.registerConversationalProfileBuzz(
                clone(model),
                act.bale as any,
                state!,
            )
        case Act.VALIDATE_ESCALATION_CEILING:
            return Buzz.validateEscalationCeilingBuzz(
                clone(model),
                act.bale as any,
                state!,
            )
        case Act.EVALUATE_DIALOGUE_TURN:
            return Buzz.evaluateDialogueTurnBuzz(
                clone(model),
                act.bale as any,
                state!,
            )
        case Act.AUDIT_DIALOGUE_ATTENUATION:
            return Buzz.auditDialogueAttenuationBuzz(
                clone(model),
                act.bale as any,
                state!,
            )
        default:
            return model
    }
}
