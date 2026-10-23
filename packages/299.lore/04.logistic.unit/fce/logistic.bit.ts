export default interface LogisticBit<TDat = unknown, TLst = unknown> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    lst?: TLst[]
    slv?: (result: { logBit: Partial<LogisticBit<any, any>> }) => void
}
