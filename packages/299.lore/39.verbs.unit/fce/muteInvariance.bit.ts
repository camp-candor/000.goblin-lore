import type {
    MuteInvarianceQuery,
    MuteInvarianceReceipt,
} from '../val/muteInvariance.val'

export interface MuteInvarianceBit {
    idx: string
    src?: string
    val?: number
    dat?: MuteInvarianceQuery | MuteInvarianceReceipt
    slv?: (result: {
        vrbBit: { idx: string; val: number; dat: MuteInvarianceReceipt }
    }) => void
}
