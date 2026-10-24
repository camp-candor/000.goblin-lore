import { CharacterFrontmatter } from '../../26.schema.unit/val/characterFrontmatter.val.js'
import { VoiceRailSectionsBit } from '../../26.schema.unit/fce/characterDossier.bit.js'

export interface SerializeCharacterDossierConfigBit {
    readonly seriesSlug: string
    readonly frontmatter: CharacterFrontmatter
    readonly voiceRail: VoiceRailSectionsBit
    readonly customRoot?: string
}

export interface SerializeCharacterDossierResultBit {
    readonly characterId: string
    readonly filePath: string
    readonly byteZeroVerified: boolean
    readonly contentSha256: string
}

export default interface SerializerBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: SerializeCharacterDossierConfigBit
    readonly slv?: (res: any) => void
}
