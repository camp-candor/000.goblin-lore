export default interface TraumaBit<TDat = any, TLst = any> {
    idx: string
    src?: string
    lst?: TLst[]
    val?: number
    dat?: TDat
    slv?: (result: { trmBit: Partial<TraumaBit<TDat, TLst>> }) => void
}
