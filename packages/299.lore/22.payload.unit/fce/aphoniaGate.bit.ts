import type {
    VocalFeasibilityCandidate,
    VocalFeasibilityReceipt,
} from '../val/aphoniaGate.val.js'

export interface AphoniaGateBitPayload {
    readonly candidate?: VocalFeasibilityCandidate
    readonly receipt?: VocalFeasibilityReceipt
    readonly errorCode?: string
    readonly reason?: string
}

export default interface AphoniaGateBit {
    idx: string
    src?: string
    val?: number
    dat?:
        | AphoniaGateBitPayload
        | VocalFeasibilityCandidate
        | VocalFeasibilityReceipt
    slv?: (result: { aphBit: Partial<AphoniaGateBit> }) => void
}
