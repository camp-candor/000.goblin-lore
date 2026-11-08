import type CharacterBit from './character.bit.js'

export default interface Character {
    idx: string
    characterBitList: CharacterBit[]
    characterBits: Record<string, CharacterBit>
}
