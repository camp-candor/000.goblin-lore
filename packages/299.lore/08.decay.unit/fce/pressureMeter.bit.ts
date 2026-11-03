import type {
    PressureMeter,
    FrictionDebitEvent,
} from '../val/pressureMeter.val.js'

export interface PressureMeterBitPayload {
    readonly meter: PressureMeter
    readonly frictionDebits?: readonly FrictionDebitEvent[]
    readonly cyclesCount?: number
}

export interface ThermodynamicCycleReceiptBit {
    readonly meterId: string
    readonly entityId: string
    readonly category: string
    readonly previousValueBp: number
    readonly currentValueBp: number
    readonly baselineBp: number
    readonly dissipatedBp: number
    readonly accumulatedDebitsBp: number
    readonly isThresholdBreached: boolean
    readonly updatedTick: number
}

export default interface PressureMeterBit {
    idx: string
    src?: string
    val?: number
    dat?: PressureMeterBitPayload | ThermodynamicCycleReceiptBit
    slv?: (result: { dcyBit: Partial<PressureMeterBit> }) => void
}
