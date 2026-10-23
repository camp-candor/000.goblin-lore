import { Action } from '../99.core/interface/action.interface'
import EscalationBit from './fce/escalation.bit'
import AttenuationBit from './fce/attenuation.bit'

export const INIT_ESCALATION = '[Escalation action] Init Escalation'
export class InitEscalation implements Action {
    readonly type = INIT_ESCALATION
    constructor(public bale: EscalationBit) {}
}

export const UPDATE_ESCALATION = '[Escalation action] Update Escalation'
export class UpdateEscalation implements Action {
    readonly type = UPDATE_ESCALATION
    constructor(public bale: EscalationBit) {}
}

export const REGISTER_CONVERSATIONAL_PROFILE =
    '[Escalation action] Register Conversational Profile'
export class RegisterConversationalProfile implements Action {
    readonly type = REGISTER_CONVERSATIONAL_PROFILE
    constructor(public bale: EscalationBit) {}
}

export const VALIDATE_ESCALATION_CEILING =
    '[Escalation action] Validate Escalation Ceiling'
export class ValidateEscalationCeiling implements Action {
    readonly type = VALIDATE_ESCALATION_CEILING
    constructor(public bale: EscalationBit) {}
}

export const EVALUATE_DIALOGUE_TURN =
    '[Escalation action] Evaluate Dialogue Turn'
export class EvaluateDialogueTurn implements Action {
    readonly type = EVALUATE_DIALOGUE_TURN
    constructor(public bale: EscalationBit) {}
}

export const AUDIT_DIALOGUE_ATTENUATION =
    '[Escalation action] Audit Dialogue Attenuation'
export class AuditDialogueAttenuation implements Action {
    readonly type = AUDIT_DIALOGUE_ATTENUATION
    constructor(public bale: AttenuationBit) {}
}

export type Actions =
    | InitEscalation
    | UpdateEscalation
    | RegisterConversationalProfile
    | ValidateEscalationCeiling
    | EvaluateDialogueTurn
    | AuditDialogueAttenuation
