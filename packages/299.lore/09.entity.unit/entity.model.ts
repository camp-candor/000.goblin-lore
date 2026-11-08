import type Entity from './fce/entity.interface.js'
import type EntityBit from './fce/entity.bit.js'

export class EntityModel implements Entity {
    idx: string = '09.entity'
    entityBitList: EntityBit[] = []
    entityBits: Record<string, EntityBit> = {}
}
