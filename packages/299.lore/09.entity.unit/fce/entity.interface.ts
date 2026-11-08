import type EntityBit from './entity.bit.js'

export default interface Entity {
  idx: string
  entityBitList: EntityBit[]
  entityBits: Record<string, EntityBit>
}
