import type TargetBit from './target.bit.js'

export default interface Target {
    idx: string
    targetBitList: TargetBit[]
    targetBits: Record<string, TargetBit>
}
