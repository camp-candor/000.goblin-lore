import type LeverageBit from './leverage.bit.js'

export default interface Leverage {
    idx: string
    leverageBitList: LeverageBit[]
    leverageBits: Record<string, LeverageBit>
}
