export default interface EscalationBit<TDat = unknown, TLst = unknown> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    lst?: TLst[]
    slv?: (result: { escBit: Partial<EscalationBit<TDat, TLst>> }) => void
}
