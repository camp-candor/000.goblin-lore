import type Character from './fce/character.interface.js'
import type CharacterBit from './fce/character.bit.js'

export class CharacterModel implements Character {
    idx: string = '02.character'
    characterBitList: CharacterBit[] = []
    characterBits: Record<string, CharacterBit> = {}
}
