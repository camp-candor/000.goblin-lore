import type EscalationBit from './escalation.bit.js'
import type {
    ActStage,
    PacingBudgetConfig,
} from '../../38.types.unit/fce/autoScriptRule.interface.js'

export default interface Escalation {
    idx: string
    escalationBitList: EscalationBit[]
    escalationBits: Record<string, EscalationBit>
}

export type DaypartLabel = 'DAWN' | 'MORNING' | 'AFTERNOON' | 'DUSK' | 'NIGHT'

export interface ThreeActCurveEvaluation {
    actStage: ActStage
    progressBps: number
    actMultiplierBps: number
    diurnalWeightBps: number
    combinedMultiplierBps: number
    daypart: DaypartLabel
    pacing: PacingBudgetConfig
}
