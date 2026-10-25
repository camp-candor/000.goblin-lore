import type {
    CharacterFrontmatter,
    LocomotionBaseline,
} from '../val/characterFrontmatter.val.js'

export type CharacterStatus = 'active' | 'departed' | 'dormant'

export interface CharacterSomaticVectorBit {
    readonly arms_available_bp: number
    readonly locomotion_baseline: LocomotionBaseline
    readonly motor_limitations: readonly string[]
    readonly banned_kinetic_verbs: readonly string[]
}

export interface CharacterLogisticalVectorBit {
    readonly max_mass_grams: number
    readonly worn_slots: readonly string[]
    readonly carried_inventory: readonly string[]
}

export interface CharacterEpistemicVectorBit {
    readonly active_strings_held: readonly string[]
    readonly conversation_refusal_triggers: readonly string[]
    readonly forbidden_disclosure_tokens: readonly string[]
}

export interface CharacterDossierFrontmatterBit {
    readonly id: string
    readonly type: 'character'
    readonly name: string
    readonly status: CharacterStatus
    readonly somatic: CharacterSomaticVectorBit
    readonly logistical: CharacterLogisticalVectorBit
    readonly epistemic: CharacterEpistemicVectorBit
    readonly created_epoch: number
    readonly last_updated_epoch: number
}

export interface VoiceRailSectionsBit {
    readonly wantsSurface: string
    readonly wantsActual: string
    readonly blindSpot: string
    readonly voiceNotes: string
    readonly fewShotLines: readonly string[]
}

export interface DualRailCharacterBit {
    readonly machineRail: CharacterFrontmatter
    readonly voiceRail: VoiceRailSectionsBit
    readonly byteZeroVerified: boolean
    readonly contentSha256: string
}

export default interface SchemaBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: any
    readonly slv?: (res: any) => void
}
