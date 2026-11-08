import type RelationBit from './relation.bit.js'

export default interface Relation {
  idx: string
  relationBitList: RelationBit[]
  relationBits: Record<string, RelationBit>
}
