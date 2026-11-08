import type ActionBit from './action.bit.js'

export default interface Action {
  idx: string
  actionBitList: ActionBit[]
  actionBits: Record<string, ActionBit>
}
