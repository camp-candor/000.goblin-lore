import type {
    ThresholdEvaluationInput,
    PostBreakReceipt,
} from '../val/postBreak.val.js'

export interface PostBreakBitPayload {
    readonly input?: ThresholdEvaluationInput
    readonly receipt?: PostBreakReceipt
    readonly isBreached?: boolean
    readonly errorCode?: string
    readonly reason?: string
}

export default interface ThresholdBit {
    idx: string
    src?: string
    val?: number
    dat?: PostBreakBitPayload | PostBreakReceipt
    slv?: (result: { trhBit: Partial<ThresholdBit> }) => void
}
