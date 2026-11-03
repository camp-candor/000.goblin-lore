import {
    ParanoiaMeterStateSchema,
    PitchFlutterResultSchema,
    assertIntegerMetric,
    type ParanoiaMeterState,
    type PitchFlutterResult,
} from '../val/paranoiaClock.val.js'

export function calculatePitchFlutterProfile(
    clockInput: ParanoiaMeterState,
): PitchFlutterResult {
    const clock = ParanoiaMeterStateSchema.parse(clockInput)
    const currentBps = clock.currentBps
    assertIntegerMetric(currentBps, 'currentBps')

    // Tremor frequency scales smoothly from 4.0 Hz (40,000 bps) to 7.5 Hz (75,000 bps)
    const subharmonicFlutterHzBps =
        40000 + Math.floor((35000 * currentBps) / 10000)

    // Tremor depth: 0 to 250 centitones (up to 2.5 semitones vibrato pitch instability)
    const flutterDepthCentitones = Math.floor((250 * currentBps) / 10000)

    // Phase 2 Paranoid Hypervigilance: vision narrows from 120 deg down to 60 deg above 5000 bps
    const isHypervigilant = currentBps >= 5000
    let visionConeDegrees = 120
    if (currentBps >= 8000) {
        visionConeDegrees = 45 // Extreme tunnel vision
    } else if (isHypervigilant) {
        visionConeDegrees = 60 // Narrowing vigilance cone
    }

    const result: PitchFlutterResult = {
        entityId: clock.entityId,
        currentBps,
        subharmonicFlutterHzBps,
        flutterDepthCentitones,
        isHypervigilant,
        visionConeDegrees,
    }

    return PitchFlutterResultSchema.parse(result)
}
