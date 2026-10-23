import type { LimbClampingReceipt } from '../val/wound.val.js'

export interface WoundRecord {
    woundId: string
    conditionTag: string
    severityBps: number
    isPermanent: boolean
}

export default interface Wound {
    idx: string
    clampedReceipts: Record<string, LimbClampingReceipt>
}
