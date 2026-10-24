import type { TraumaModel } from '../trauma.model'
import type TraumaBit from '../fce/trauma.bit'
import type State from '../../99.core/state'
import { calculateSensoryAcuityProfile } from './sensory.buzz'
import { calculateVocalDspProfile } from './vocalDsp.buzz'
import {
    calculateSomaticDeltaResolution,
    createDefaultSomaticReceipt,
} from './somaticDelta.buzz'
import type { SensoryAcuityInput } from '../val/sensory.val'
import type { VocalDspModifierInput } from '../val/vocalDsp.val'
import type { SomaticDeltaInput } from '../val/somaticDelta.val'

export const initTrauma = (
    cpy: TraumaModel,
    bal: TraumaBit,
    _ste?: State,
): TraumaModel => {
    cpy.sensoryProfiles = {}
    cpy.vocalDspProfiles = {}
    cpy.somaticStates = {}
    if (bal?.slv) bal.slv({ trmBit: { idx: 'init-trauma', val: 0 } })
    return cpy
}

export const updateTrauma = (
    cpy: TraumaModel,
    bal: TraumaBit,
    _ste?: State,
): TraumaModel => {
    if (bal?.slv) bal.slv({ trmBit: { idx: 'update-trauma' } })
    return cpy
}

export const configureSensoryAcuity = (
    cpy: TraumaModel,
    bal: TraumaBit<SensoryAcuityInput, unknown>,
    _ste?: State,
): TraumaModel => {
    const payload = bal?.dat
    if (!payload?.entityId) {
        if (bal?.slv) {
            bal.slv({
                trmBit: {
                    idx: 'configure-sensory-acuity-err',
                    src: 'MISSING_PAYLOAD',
                    val: -1,
                },
            })
        }
        return cpy
    }

    try {
        const profile = calculateSensoryAcuityProfile(payload)
        cpy.sensoryProfiles[profile.entityId] = profile

        if (bal?.slv) {
            bal.slv({
                trmBit: {
                    idx: 'configure-sensory-acuity-ok',
                    src: profile.entityId,
                    val: profile.visualAcuityBps,
                    dat: profile,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (bal?.slv) {
            bal.slv({
                trmBit: {
                    idx: 'configure-sensory-acuity-fail',
                    src: payload.entityId,
                    val: -1,
                    dat: { error: message } as any,
                },
            })
        }
    }

    return cpy
}

export const configureVocalDsp = (
    cpy: TraumaModel,
    bal: TraumaBit<VocalDspModifierInput, unknown>,
    _ste?: State,
): TraumaModel => {
    const payload = bal?.dat
    if (!payload?.entityId) {
        if (bal?.slv) {
            bal.slv({
                trmBit: {
                    idx: 'configure-vocal-dsp-err',
                    src: 'MISSING_PAYLOAD',
                    val: -1,
                },
            })
        }
        return cpy
    }

    try {
        const profile = calculateVocalDspProfile(payload)
        cpy.vocalDspProfiles[profile.entityId] = profile

        if (bal?.slv) {
            bal.slv({
                trmBit: {
                    idx: 'configure-vocal-dsp-ok',
                    src: profile.entityId,
                    val: profile.formantWarpingBps,
                    dat: profile,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (bal?.slv) {
            bal.slv({
                trmBit: {
                    idx: 'configure-vocal-dsp-fail',
                    src: payload.entityId,
                    val: -1,
                    dat: { error: message } as any,
                },
            })
        }
    }

    return cpy
}

export const resolveSomaticDelta = (
    cpy: TraumaModel,
    bal: TraumaBit<SomaticDeltaInput, unknown>,
    _ste?: State,
): TraumaModel => {
    const payload = bal?.dat
    if (!payload?.entityId) {
        if (bal?.slv) {
            bal.slv({
                trmBit: {
                    idx: 'resolve-somatic-delta-err',
                    src: 'MISSING_PAYLOAD',
                    val: -1,
                },
            })
        }
        return cpy
    }

    try {
        const existing =
            cpy.somaticStates[payload.entityId] ||
            createDefaultSomaticReceipt(
                payload.entityId,
                payload.locomotionBaseline,
            )

        const receipt = calculateSomaticDeltaResolution(existing, payload)
        cpy.somaticStates[payload.entityId] = receipt
        cpy.sensoryProfiles[payload.entityId] = receipt.sensoryProfile
        cpy.vocalDspProfiles[payload.entityId] = receipt.vocalDspProfile

        if (bal?.slv) {
            bal.slv({
                trmBit: {
                    idx: 'resolve-somatic-delta-ok',
                    src: receipt.entityId,
                    val: receipt.painBps,
                    dat: receipt,
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (bal?.slv) {
            bal.slv({
                trmBit: {
                    idx: 'resolve-somatic-delta-fail',
                    src: payload.entityId,
                    val: -1,
                    dat: { error: message } as any,
                },
            })
        }
    }

    return cpy
}

/**
 * Map of somatic condition identifiers to their upper-limb impairment penalties in basis points.
 * 10000 bp = 1 arm; 20000 bp = 2 arms.
 */
const SOMATIC_LIMB_PENALTIES: Record<string, number> = {
    AMPUTATION_LEFT_ARM: 10000,
    AMPUTATION_RIGHT_ARM: 10000,
    BRACHIAL_PLEXUS_LEFT: 10000,
    BRACHIAL_PLEXUS_RIGHT: 10000,
    FRACTURED_HUMERUS_LEFT: 8000,
    FRACTURED_HUMERUS_RIGHT: 8000,
    DISLOCATED_SHOULDER_LEFT: 5000,
    DISLOCATED_SHOULDER_RIGHT: 5000,
    BILATERAL_AMPUTATION_ARMS: 20000,
    TOTAL_PARALYSIS: 20000,
}

export interface LimbCapacityResult {
    readonly available_arms_bp: number
    readonly total_penalty_bp: number
    readonly active_penalties: Record<string, number>
}

/**
 * Computes net available functional arms in integer basis points.
 * Clamps lower bound to 0 bp to prevent negative numbers.
 */
export function computeFunctionalLimbsBuzz(
    baseArmsBp: number = 20000,
    conditions: readonly string[] = [],
): LimbCapacityResult {
    let totalPenaltyBp = 0
    const activePenalties: Record<string, number> = {}

    for (const condition of conditions) {
        const penalty = SOMATIC_LIMB_PENALTIES[condition.toUpperCase()]
        if (penalty !== undefined) {
            totalPenaltyBp += penalty
            activePenalties[condition] = penalty
        }
    }

    const availableArmsBp = Math.max(0, baseArmsBp - totalPenaltyBp)

    return {
        available_arms_bp: availableArmsBp,
        total_penalty_bp: totalPenaltyBp,
        active_penalties: activePenalties,
    }
}
