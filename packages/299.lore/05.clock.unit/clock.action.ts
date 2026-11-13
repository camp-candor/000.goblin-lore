import { Action } from '../99.core/interface/action.interface'
import ClockBit from './fce/clock.bit'

export const INIT_CLOCK = '[Clock action] Init Clock'
export class InitClock implements Action {
    readonly type = INIT_CLOCK
    constructor(public bale: ClockBit) {}
}

export const UPDATE_CLOCK = '[Clock action] Update Clock'
export class UpdateClock implements Action {
    readonly type = UPDATE_CLOCK
    constructor(public bale: ClockBit) {}
}

export const DERIVE_CHRONOLOGY = '[Clock action] Derive Chronology'
export class DeriveChronology implements Action {
    readonly type = DERIVE_CHRONOLOGY
    constructor(public bale: ClockBit) {}
}

export const ADVANCE_CLOCK = '[Clock action] Advance Clock'
export class AdvanceClock implements Action {
    readonly type = ADVANCE_CLOCK
    constructor(public bale: ClockBit) {}
}

export const FORMAT_TIMECODE = '[Clock action] Format Timecode'
export class FormatTimecode implements Action {
    readonly type = FORMAT_TIMECODE
    constructor(public bale: ClockBit) {}
}

export type Actions =
    InitClock | UpdateClock | DeriveChronology | AdvanceClock | FormatTimecode
