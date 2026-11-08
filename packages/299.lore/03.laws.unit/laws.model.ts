import type Laws from './fce/laws.interface.js'
import type LawsBit from './fce/laws.bit.js'

export class LawsModel implements Laws {
  idx: string = '03.laws'
  lawsBitList: LawsBit[] = []
  lawsBits: Record<string, LawsBit> = {}
}
