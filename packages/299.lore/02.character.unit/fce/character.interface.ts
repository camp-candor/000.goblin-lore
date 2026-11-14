import type CharacterBit from './character.bit.js'
import type { SignificantEventCategory } from '../../38.types.unit/fce/autoScriptRule.interface.js'

export default interface Character {
    idx: string
    characterBitList: CharacterBit[]
    characterBits: Record<string, CharacterBit>
}

export interface CharacterVoiceProfile {
    entityId: string
    cue: string
    defaultParenthetical: string
    parentheticalsByCategory: Record<SignificantEventCategory, string[]>
    linesByCategory: Record<SignificantEventCategory, string[]>
    curtnessMaxWords: number
}
