import {
    assertIntegerMetric,
    clamp,
    divRoundHalfEven,
} from '../val/algebraicDsp.val.js'

export interface VocalFryVisceralResult {
    effectiveVocalFryDensityBps: number
    visceralReflexHoldFrames: number
}

export function composeVocalFryVisceralHold(
    baseVocalFryDensityBps: number,
    deltaFryBps: number,
    somaticFatigueBps: number,
    physicalPainBps: number,
): VocalFryVisceralResult {
    assertIntegerMetric(baseVocalFryDensityBps, 'baseVocalFryDensityBps')
    assertIntegerMetric(deltaFryBps, 'deltaFryBps')
    assertIntegerMetric(somaticFatigueBps, 'somaticFatigueBps')
    assertIntegerMetric(physicalPainBps, 'physicalPainBps')

    // Fry formula:
    // Phi_eff = clamp(baseVocalFry + Delta_Fry_scene + 0.50*(FATIGUE/10000) + 0.40*(PAIN/10000), 0.0, 1.0)
    const fatigueContribution = divRoundHalfEven(
        5000 * somaticFatigueBps,
        10000,
    )
    const painContribution = divRoundHalfEven(4000 * physicalPainBps, 10000)

    const rawFry =
        baseVocalFryDensityBps +
        deltaFryBps +
        fatigueContribution +
        painContribution
    let effectiveVocalFryDensityBps = clamp(rawFry, 0, 10000)

    // When SOMATIC_FATIGUE > 8000 bp, enforce a minimum floor of 8500 bps (0.85)
    if (somaticFatigueBps > 8000) {
        effectiveVocalFryDensityBps = Math.max(
            8500,
            effectiveVocalFryDensityBps,
        )
    }

    // When PHYSICAL_PAIN >= 7000 bp, inject mandatory 18-frame visceral reflex hold
    let visceralReflexHoldFrames = 0
    if (physicalPainBps >= 7000) {
        visceralReflexHoldFrames = 18
    }

    return {
        effectiveVocalFryDensityBps,
        visceralReflexHoldFrames,
    }
}
