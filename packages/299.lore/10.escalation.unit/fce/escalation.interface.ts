import {
    CharacterConversationalProfile,
    DialogueTurnEvaluationInput,
} from '../val/escalation.val'

export interface AttenuationLeakDiagnosticBit {
    readonly leaked_token: string
    readonly token_index: number
}

export interface EscalationEvaluationResultBit {
    readonly valid: boolean
    readonly actor_id: string
    readonly proposed_tier: number
    readonly ceiling_tier: number
    readonly leaks: readonly AttenuationLeakDiagnosticBit[]
    readonly errorCode?:
        | 'NONE'
        | 'ESCALATION_CEILING_BOUNDS_BREACH'
        | 'PERSONALITY_STAT_BOUNDS_BREACH'
        | 'CONVERSATIONAL_CEILING_BREACH'
        | 'SUBTEXT_ATTENUATION_LEAK'
        | 'SCHEMA_VALIDATION_ERROR'
    readonly reason?: string
}

export default interface Escalation {
    idx: string
    profiles: Record<string, CharacterConversationalProfile>
    audit_history: EscalationEvaluationResultBit[]
}
