import type { ParanoiaModel } from './paranoia.model.js'
import type ParanoiaClockBit from './fce/paranoiaClock.bit.js'
import type State from '../99.core/state.js'
import {
    calculateAcousticImpulseStep,
    decayParanoiaClock,
} from './buz/acousticImpulse.buzz.js'
import { calculatePitchFlutterProfile } from './buz/pitchFlutter.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

export const initParanoia = (
    cpy: ParanoiaModel,
    bal: ParanoiaClockBit,
    _ste: State,
): ParanoiaModel => {
    cpy.clocksByEntity = {}
    cpy.lastReceipts = {}
    cpy.flutterProfiles = {}
    if (bal?.slv) {
        bal.slv({ parBit: { idx: 'init-paranoia-ok', val: 1 } })
    }
    return cpy
}

export const updateParanoia = (
    cpy: ParanoiaModel,
    bal: ParanoiaClockBit,
    _ste: State,
): ParanoiaModel => {
    if (bal?.slv) {
        bal.slv({ parBit: { idx: 'update-paranoia-ok', val: 1 } })
    }
    return cpy
}

export const applyAcousticTransientImpulse = async (
    cpy: ParanoiaModel,
    bal: ParanoiaClockBit & { dat: any },
    ste: State,
): Promise<ParanoiaModel> => {
    const payload = bal.dat
    if (!payload || !payload.clock || !payload.acousticEvent) {
        if (bal.slv)
            bal.slv({ parBit: { idx: 'apply-acoustic-impulse-fail', val: -1 } })
        return cpy
    }

    try {
        const receipt = calculateAcousticImpulseStep(
            payload.clock,
            payload.acousticEvent,
            payload.epoch || 0,
        )

        cpy.clocksByEntity[receipt.entityId] = {
            ...payload.clock,
            currentBps: receipt.nextBps,
            isTriggered: receipt.isTriggered,
            updatedAtEpoch: receipt.updatedEpoch,
        }
        cpy.lastReceipts[receipt.entityId] = receipt

        if (ste) {
            const alertNotice = receipt.isTriggered
                ? ' [!] BOIL-OVER TRIPPED'
                : ''
            await ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [ACOUSTIC_IMPULSE] ${receipt.entityId} | Arrival: ${receipt.arrivalIntensityCdB} cdB | Next: ${receipt.nextBps}/${payload.clock.thresholdLimitBps} bps${alertNotice} [OK]`,
            })
        }

        if (bal.slv) {
            bal.slv({
                parBit: {
                    idx: 'apply-acoustic-impulse-ok',
                    val: receipt.nextBps,
                    dat: receipt,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (ste) {
            await ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [ACOUSTIC_IMPULSE FAIL] ${message}`,
            })
        }
        if (bal.slv) {
            bal.slv({
                parBit: {
                    idx: 'apply-acoustic-impulse-err',
                    val: -1,
                    src: message,
                },
            })
        }
    }

    return cpy
}

export const decayParanoiaTick = async (
    cpy: ParanoiaModel,
    bal: ParanoiaClockBit & { dat: any },
    ste: State,
): Promise<ParanoiaModel> => {
    const payload = bal.dat
    if (!payload || !payload.clock) {
        if (bal.slv)
            bal.slv({ parBit: { idx: 'decay-paranoia-fail', val: -1 } })
        return cpy
    }

    try {
        const receipt = decayParanoiaClock(payload.clock, payload.epoch || 0)
        cpy.clocksByEntity[receipt.entityId] = {
            ...payload.clock,
            currentBps: receipt.nextBps,
            isTriggered: receipt.isTriggered,
            updatedAtEpoch: receipt.updatedEpoch,
        }
        cpy.lastReceipts[receipt.entityId] = receipt

        if (ste) {
            await ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [PARANOIA_DECAY] ${receipt.entityId} decayed to ${receipt.nextBps} bps (Darkness Lock: ${payload.clock.ambientDarknessLock}) [OK]`,
            })
        }

        if (bal.slv) {
            bal.slv({
                parBit: {
                    idx: 'decay-paranoia-ok',
                    val: receipt.nextBps,
                    dat: receipt,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (bal.slv) {
            bal.slv({
                parBit: {
                    idx: 'decay-paranoia-err',
                    val: -1,
                    src: message,
                },
            })
        }
    }

    return cpy
}

export const computeParanoiaPitchFlutter = (
    cpy: ParanoiaModel,
    bal: ParanoiaClockBit & { dat: any },
    _ste: State,
): ParanoiaModel => {
    const payload = bal.dat
    if (!payload || !payload.clock) {
        if (bal.slv)
            bal.slv({ parBit: { idx: 'compute-pitch-flutter-fail', val: -1 } })
        return cpy
    }

    try {
        const flutter = calculatePitchFlutterProfile(payload.clock)
        cpy.flutterProfiles[flutter.entityId] = flutter

        if (bal.slv) {
            bal.slv({
                parBit: {
                    idx: 'compute-pitch-flutter-ok',
                    val: flutter.flutterDepthCentitones,
                    dat: flutter,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (bal.slv) {
            bal.slv({
                parBit: {
                    idx: 'compute-pitch-flutter-err',
                    val: -1,
                    src: message,
                },
            })
        }
    }

    return cpy
}
