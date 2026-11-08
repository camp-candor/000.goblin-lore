import type Leverage from './fce/leverage.interface.js'
import type LeverageBit from './fce/leverage.bit.js'

export class LeverageModel implements Leverage {
  idx: string = '17.leverage'
  leverageBitList: LeverageBit[] = []
  leverageBits: Record<string, LeverageBit> = {}
}
