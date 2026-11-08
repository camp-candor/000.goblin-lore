import type StageBit from './stage.bit.js'

export default interface Stage {
  idx: string
  stageBitList: StageBit[]
  stageBits: Record<string, StageBit>
}
