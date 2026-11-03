import {
    ParanoiaMeterStateSchema,
    AcousticTransientEventSchema,
    assertIntegerMetric,
    clampBps,
    type ParanoiaMeterState,
    type AcousticTransientEvent,
} from '../val/paranoiaClock.val.js'
import type { AcousticImpulseReceiptBit } from '../fce/paranoiaClock.bit.js'

export function calculateAcousticImpulseStep(
    clockInput: ParanoiaMeterState,
    transientInput: AcousticTransientEvent,
    epoch: number = 0,
): AcousticImpulseReceiptBit {
    const clock = ParanoiaMeterStateSchema.parse(clockInput)
    const event = AcousticTransientEventSchema.parse(transientInput)
    assertIntegerMetric(epoch, 'epoch')

    // Arrival intensity formula: I_arrival = I_source - Loss_partition - Debuff_auditory
    const netAttenuationCdB =
        event.partitionTransmissionLossCdB + event.auditoryDebuffCdB
    const arrivalIntensityCdB = Math.max(
        0,
        event.sourceIntensityCdB - netAttenuationCdB,
    )

    // Dual-Condition Audibility Formulation
    const effectiveSnrCdB = arrivalIntensityCdB - event.ambientNoiseFloorCdB
    const isAudible =
        arrivalIntensityCdB > 0 && effectiveSnrCdB >= event.snrMinCdB

    let impulseAppliedBps = 0
    if (isAudible) {
        // Stress transfer: (SNR_cdB * couplingCoeff) / 10000
        const rawTransfer = Math.floor(
            (effectiveSnrCdB * clock.acousticCouplingCoeff) / 10000,
        )
        impulseAppliedBps = clampBps(rawTransfer)
    }

    // Passive decay handling with ambient darkness lock
    const decayRate = clock.ambientDarknessLock ? 0 : clock.decayRatePerTick

    const nextBps = clampBps(
        Math.max(
            clock.baselineBps,
            clock.currentBps - decayRate + impulseAppliedBps,
        ),
    )
    const isTriggered = nextBps >= clock.thresholdLimitBps

    const receipt: AcousticImpulseReceiptBit = {
        clockId: clock.clockId,
        entityId: clock.entityId,
        previousBps: clock.currentBps,
        nextBps,
        baselineBps: clock.baselineBps,
        arrivalIntensityCdB,
        effectiveSnrCdB,
        isAudible,
        impulseAppliedBps,
        isTriggered,
        updatedEpoch: epoch,
    }

    return Object.freeze(receipt)
}

export function decayParanoiaClock(
    clockInput: ParanoiaMeterState,
    epoch: number = 0,
): AcousticImpulseReceiptBit {
    const clock = ParanoiaMeterStateSchema.parse(clockInput)
    const decayRate = clock.ambientDarknessLock ? 0 : clock.decayRatePerTick
    const cooledBps = Math.max(clock.baselineBps, clock.currentBps - decayRate)
    const isTriggered = cooledBps >= clock.thresholdLimitBps

    const receipt: AcousticImpulseReceiptBit = {
        clockId: clock.clockId,
        entityId: clock.entityId,
        previousBps: clock.currentBps,
        nextBps: cooledBps,
        baselineBps: clock.baselineBps,
        arrivalIntensityCdB: 0,
        effectiveSnrCdB: 0,
        isAudible: false,
        impulseAppliedBps: 0,
        isTriggered,
        updatedEpoch: epoch,
    }

    return Object.freeze(receipt)
}
