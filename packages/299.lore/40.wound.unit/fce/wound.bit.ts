export default interface WoundBit<TDat = any, TLst = any> {
    idx: string
    src?: string
    lst?: TLst[]
    val?: number
    dat?: TDat
    slv?: (result: { wndBit: Partial<WoundBit<any, TLst>> }) => void
}
