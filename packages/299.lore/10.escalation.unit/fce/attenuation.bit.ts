import { AttenuationDirective } from '../val/attenuation.val'

export default interface AttenuationBit<
    TDat = unknown,
    TLst = AttenuationDirective,
> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    lst?: TLst[]
    slv?: (result: { attBit: Partial<AttenuationBit<TDat, TLst>> }) => void
}
