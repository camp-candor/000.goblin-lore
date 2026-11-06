import clone from 'clone-deep'
import * as Act from './payload.action.js'
import { PayloadModel } from './payload.model.js'
import * as Buzz from './payload.buzzer.js'
import type State from '../99.core/state.js'

export function reducer(
    model: PayloadModel = new PayloadModel(),
    act: Act.Actions,
    state?: State,
): PayloadModel {
    switch (act.type) {
        case Act.INIT_PAYLOAD:
            return Buzz.initPayload(clone(model), act.bale, state!)

        case Act.UPDATE_PAYLOAD:
            return Buzz.updatePayload(clone(model), act.bale, state!)

        case Act.VALIDATE_TTS_PAYLOAD:
            Buzz.validateTtsPayload(clone(model), act.bale as any, state!)
            return model

        case Act.VERIFY_VOCAL_FEASIBILITY:
            Buzz.verifyVocalFeasibility(clone(model), act.bale as any, state!)
            return model

        case Act.CHECK_SCENE_SOMATIC_STALENESS:
            Buzz.checkSceneSomaticStaleness(
                clone(model),
                act.bale as any,
                state!,
            )
            return model

        case Act.HASH_TTS_GENERATION_PAYLOAD:
            Buzz.hashTtsGenerationPayload(clone(model), act.bale as any, state!)
            return model

        case Act.VERIFY_PAYLOAD_HASH_PARITY:
            Buzz.verifyPayloadHashParity(clone(model), act.bale as any, state!)
            return model

        default:
            return model
    }
}
