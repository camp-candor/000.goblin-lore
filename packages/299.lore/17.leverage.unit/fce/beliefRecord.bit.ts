import { BeliefRecord } from '../val/beliefRecord.val'

export default interface BeliefRecordBit<TDat = unknown, TLst = BeliefRecord> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    lst?: TLst[]
    slv?: (result: { belBit: Partial<BeliefRecordBit<any, any>> }) => void
}
