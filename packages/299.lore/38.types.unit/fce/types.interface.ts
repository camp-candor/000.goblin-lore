import type TypesBit from './types.bit.js'

export default interface Types {
    idx: string
    typesBitList: TypesBit[]
    typesBits: Record<string, TypesBit>
}
