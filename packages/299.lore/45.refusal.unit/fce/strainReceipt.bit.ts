import type { RefusalStrainReceipt } from '../val/strain.val'

/**
 * Payload interface for strain evaluation requests.
 */
export interface RefusalStrainEvaluationBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}

/**
 * Typed receipt bit returned by the strain clamper buzzer.
 */
export interface RefusalStrainReceiptBit {
    idx: string
    val: number
    dat: RefusalStrainReceipt
}
