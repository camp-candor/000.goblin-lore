import type LogisticBit from './logistic.bit.js'

export default interface Logistic {
    idx: string
    logisticBitList: LogisticBit[]
    logisticBits: Record<string, LogisticBit>
}
