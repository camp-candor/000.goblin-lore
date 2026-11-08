import type Relation from './fce/relation.interface.js'
import type RelationBit from './fce/relation.bit.js'

export class RelationModel implements Relation {
  idx: string = '25.relation'
  relationBitList: RelationBit[] = []
  relationBits: Record<string, RelationBit> = {}
}
