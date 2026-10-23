export default interface GearBit<TDat = unknown, TLst = unknown> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    lst?: TLst[]
    slv?: (result: { gearBit: Partial<GearBit<TDat, TLst>> }) => void
}
