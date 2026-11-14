import type {
    CalendarClockSnapshot,
    LunarPhaseToken,
    SolarMarkerToken,
    WeekdayToken,
} from '../../38.types.unit/fce/chronology.interface.js'
import type ClockBit from './clock.bit.js'

export interface LunarPhaseSnapshot {
    readonly phase: LunarPhaseToken
    readonly illuminationBps: number
    readonly ageSeconds: number
    readonly cycleProgressBps: number
}

export interface ExpandedBeatOccurrence {
    readonly beat_id: string
    readonly isoDate: string
    readonly occurrenceIsoDate: string
    readonly startTimeHm: string
    readonly beatCategory: string
    readonly targetTick: number
    readonly reserveStartTick: number
    readonly reserveCooldownTicks: number
    readonly weekday: WeekdayToken
    readonly lunarPhase: LunarPhaseToken
    readonly solarMarker: SolarMarkerToken | null
    readonly shifted: boolean
    readonly shiftedFrom?: string
    readonly valid: true
}

export interface RecurrenceHorizonProjection {
    readonly startDate: string
    readonly horizonDays: number
    readonly occurrences: readonly ExpandedBeatOccurrence[]
}

export default interface Clock {
    idx: string
    clockBitList: ClockBit[]
    clockBits: Record<string, ClockBit>
    snapshot: CalendarClockSnapshot | null
    lastFormattedBanner: string
}
