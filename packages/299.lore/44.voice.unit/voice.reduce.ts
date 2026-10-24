import clone from 'clone-deep'
import * as Act from './voice.action'
import { VoiceModel } from './voice.model'
import * as Buzz from './voice.buzzer'
import type State from '../99.core/state'

export function reducer(
    model: VoiceModel = new VoiceModel(),
    act: Act.Actions,
    state?: State,
): VoiceModel {
    const cpy: VoiceModel =
        clone(model) === model ? clone(model, true) : clone(model)
    const ste: State = state!

    switch (act.type) {
        case Act.INIT_VOICE:
            return Buzz.initVoice(cpy, act.bale, ste)

        case Act.UPDATE_VOICE:
            return Buzz.updateVoice(cpy, act.bale, ste)

        case Act.PARSE_VOICE_RAIL:
            return Buzz.parseVoiceRail(cpy, act.bale, ste)

        case Act.DIFFERENTIATE_WANTS:
            return Buzz.differentiateWants(cpy, act.bale, ste)

        case Act.VALIDATE_COMEDIC_REGISTER:
            return Buzz.validateComedicRegister(cpy, act.bale, ste)

        case Act.VALIDATE_RISK_PROFILE:
            return Buzz.validateRiskProfile(cpy, act.bale, ste)

        case Act.CHECK_PROGRESSION_LOCK:
            return Buzz.checkProgressionLock(cpy, act.bale, ste)

        case Act.RESOLVE_PROGRESSION_LOCK:
            return Buzz.resolveProgressionLock(cpy, act.bale, ste)

        default:
            return cpy
    }
}
