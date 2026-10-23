import type { SomaticTraumaReceipt } from '../val/somaticDelta.val'

export default interface SomaticDeltaBit<TDat = unknown> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    slv?: (result: {
        smtBit: Partial<SomaticDeltaBit<SomaticTraumaReceipt>>
    }) => void
}
