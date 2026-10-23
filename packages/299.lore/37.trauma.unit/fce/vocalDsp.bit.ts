import type { VocalDspModifierProfile } from '../val/vocalDsp.val'

export default interface VocalDspBit<TDat = VocalDspModifierProfile> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    slv?: (result: { dspBit: Partial<VocalDspBit<TDat>> }) => void
}
