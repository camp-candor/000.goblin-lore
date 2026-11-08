import type Logistic from './fce/logistic.interface.js'
import type LogisticBit from './fce/logistic.bit.js'

export class LogisticModel implements Logistic {
    idx: string = '04.logistic'
    logisticBitList: LogisticBit[] = []
    logisticBits: Record<string, LogisticBit> = {}
}
