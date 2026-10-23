import type { SensoryAcuityProfile } from '../val/sensory.val'

export default interface SensoryBit<TDat = SensoryAcuityProfile> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    slv?: (result: { snrBit: Partial<SensoryBit<TDat>> }) => void
}
