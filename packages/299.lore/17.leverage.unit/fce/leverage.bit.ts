import { StringsLedgerRecord } from '../val/leverage.val'

export default interface LeverageBit<
    TDat = unknown,
    TLst = StringsLedgerRecord,
> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    lst?: TLst[]
    slv?: (result: { levBit: Partial<LeverageBit<TDat, TLst>> }) => void
}
