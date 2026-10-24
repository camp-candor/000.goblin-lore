import { CharacterFrontmatter } from '../val/characterFrontmatter.val.js'

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
