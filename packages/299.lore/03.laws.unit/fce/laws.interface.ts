import type LawsBit from './laws.bit.js'

export default interface Laws {
  idx: string
  lawsBitList: LawsBit[]
  lawsBits: Record<string, LawsBit>
}
