import type CooldownBit from './cooldown.bit.js'
import type { PacingBudgetConfig } from '../../38.types.unit/fce/autoScriptRule.interface.js'

export default interface Cooldown {
    idx: string
    cooldownBitList: CooldownBit[]
    cooldownBits: Record<string, CooldownBit>
}

export interface GlobalCooldownEvaluation {
    blocked: boolean
    overrideApplied: boolean
    remainingTicks: number
    remainingMinutes: number
    reason:
        | 'FIRST_SCENE'
        | 'COOLDOWN_ACTIVE'
        | 'CRITICAL_OVERRIDE'
        | 'COOLDOWN_CLEAR'
}

export interface DroughtPressureState {
    ticksSinceLastScene: number | null
    droughtBoostBps: number
    droughtBreakerActive: boolean
    pacing: PacingBudgetConfig
}
