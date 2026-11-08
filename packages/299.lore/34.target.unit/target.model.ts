import type Target from './fce/target.interface.js'
import type TargetBit from './fce/target.bit.js'

export class TargetModel implements Target {
  idx: string = '34.target'
  targetBitList: TargetBit[] = []
  targetBits: Record<string, TargetBit> = {}
}
