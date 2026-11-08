import type Types from './fce/types.interface.js'
import type TypesBit from './fce/types.bit.js'

export class TypesModel implements Types {
    idx: string = '38.types'
    typesBitList: TypesBit[] = []
    typesBits: Record<string, TypesBit> = {}
}
