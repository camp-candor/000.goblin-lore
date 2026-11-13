import { TickModel } from '../tick.model.js'
import type TickBit from '../fce/tick.bit.js'
import type State from '../../99.core/state.js'
import {
    resolveChronologyConfig,
    DEFAULT_CHRONOLOGY_CONFIG,
} from '../../38.types.unit/fce/chronology.interface.js'

export const initTick = (
    cpy: TickModel,
    bal: TickBit,
    ste?: State,
): TickModel => {
    cpy.idx = bal.idx || cpy.idx
    if (bal.slv) {
        bal.slv({ tckBit: { idx: bal.idx || 'init-tick', val: 0 } })
    }
    return cpy
}

export const updateTick = (
    cpy: TickModel,
    bal: TickBit,
    ste?: State,
): TickModel => {
    if (bal.slv) {
        bal.slv({ tckBit: { idx: bal.idx || 'update-tick', val: 0 } })
    }
    return cpy
}

export const configureTickCadence = (
    cpy: TickModel,
    bal: TickBit,
    ste?: State,
): TickModel => {
    const raw = bal?.dat?.chronology ?? bal?.dat ?? null
    const cfg = resolveChronologyConfig(raw ?? DEFAULT_CHRONOLOGY_CONFIG)
    cpy.tickSeconds = cfg.tick_seconds
    cpy.framesPerSecond = cfg.frames_per_second
    if (bal.slv) {
        bal.slv({
            tckBit: {
                idx: bal.idx || 'configure-tick-cadence',
                val: 1,
                dat: {
                    tickSeconds: cpy.tickSeconds,
                    framesPerSecond: cpy.framesPerSecond,
                },
            },
        })
    }
    return cpy
}

export const stepTickFrame = (
    cpy: TickModel,
    bal: TickBit,
    ste?: State,
): TickModel => {
    const steps = Number(bal?.dat?.steps ?? bal?.val ?? 1)
    cpy.tickIndex += steps
    cpy.totalElapsedSeconds += steps * cpy.tickSeconds
    cpy.totalFrames = cpy.totalElapsedSeconds * cpy.framesPerSecond
    if (bal.slv) {
        bal.slv({
            tckBit: {
                idx: bal.idx || 'step-tick-frame',
                val: cpy.totalFrames,
                dat: {
                    tickIndex: cpy.tickIndex,
                    totalElapsedSeconds: cpy.totalElapsedSeconds,
                    totalFrames: cpy.totalFrames,
                    tickSeconds: cpy.tickSeconds,
                    framesPerSecond: cpy.framesPerSecond,
                },
            },
        })
    }
    return cpy
}
