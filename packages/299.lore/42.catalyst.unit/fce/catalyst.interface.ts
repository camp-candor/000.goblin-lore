import type CatalystBit from './catalyst.bit.js'
import type { SignificantEventCategory } from '../../38.types.unit/fce/autoScriptRule.interface.js'

export default interface Catalyst {
    idx: string
    catalystBitList: CatalystBit[]
    catalystBits: Record<string, CatalystBit>
}

export interface CatalystEvaluationInput {
    category: SignificantEventCategory
    severityBps: number
    currentTick: number
    lastEmittedTickByCategory?: Record<string, number>
}

export interface CatalystSignificanceReceipt {
    category: SignificantEventCategory
    severityBps: number
    minSeverityBps: number
    priorityWeightBps: number
    significanceBps: number
    globalThresholdBps: number
    isSignificant: boolean
    reason: string
    currentTick: number
}
