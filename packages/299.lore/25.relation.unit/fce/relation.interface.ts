import {
    CharacterRelationProfile,
    DyadicAttitude,
    BuildEpistemicPromptInput,
} from '../val/relation.val'

export interface CompiledEpistemicPromptBit {
    readonly actor_id: string
    readonly interlocutor_id: string
    readonly active_attitude: DyadicAttitude
    readonly prompt_directive_lines: readonly string[]
    readonly omitted_proposition_count: number
    readonly hearsay_proposition_count: number
}

export interface RelationVerificationErrorBit {
    readonly actor_id: string
    readonly partner_id: string
    readonly errorCode:
        | 'ANTI_REFLEXIVITY_RELATION_BREACH'
        | 'DANGLING_RELATION_TARGET'
        | 'SCHEMA_VALIDATION_ERROR'
    readonly reason: string
}

export default interface Relation {
    idx: string
    profiles: Record<string, CharacterRelationProfile>
    errors: RelationVerificationErrorBit[]
}
