import {
    assertIntegerMetric,
    type PermanentAcousticDeltas,
} from '../val/postBreak.val.js'

export interface SealedAcousticProfileReceipt {
    pitchShiftCentitones: number
    formantWarpingBps: number
    vocalFryDensityBps: number
    breathinessPauseMultiplierBps: number
    remainingBannedCadences: string[]
}

export function sealPermanentAcousticProfile(
    currentProfile: {
        pitchShiftCentitones: number
        formantWarpingBps: number
        vocalFryDensityBps: number
        breathinessPauseMultiplierBps: number
        bannedCadences: readonly string[]
    },
    deltas: PermanentAcousticDeltas,
): SealedAcousticProfileReceipt {
    assertIntegerMetric(
        currentProfile.pitchShiftCentitones,
        'current pitchShiftCentitones',
    )
    assertIntegerMetric(
        currentProfile.formantWarpingBps,
        'current formantWarpingBps',
    )
    assertIntegerMetric(
        currentProfile.vocalFryDensityBps,
        'current vocalFryDensityBps',
    )
    assertIntegerMetric(
        currentProfile.breathinessPauseMultiplierBps,
        'current breathinessPauseMultiplierBps',
    )

    const pitchShiftCentitones = Math.max(
        -1200,
        Math.min(
            1200,
            currentProfile.pitchShiftCentitones +
                deltas.basePitchShiftCentitones,
        ),
    )
    const formantWarpingBps = Math.max(
        5000,
        Math.min(
            20000,
            Math.floor(
                (currentProfile.formantWarpingBps * deltas.formantWarpingBps) /
                    10000,
            ),
        ),
    )
    const vocalFryDensityBps = Math.min(
        10000,
        currentProfile.vocalFryDensityBps + deltas.vocalFryDensityBps,
    )
    const breathinessPauseMultiplierBps = Math.min(
        35000,
        Math.max(
            10000,
            Math.floor(
                (currentProfile.breathinessPauseMultiplierBps *
                    deltas.breathinessPauseMultiplierBps) /
                    10000,
            ),
        ),
    )

    const removedCadencesSet = new Set(
        deltas.bannedCadencesRemoved.map((c) => c.trim().toUpperCase()),
    )
    const remainingBannedCadences = currentProfile.bannedCadences.filter(
        (c) => !removedCadencesSet.has(c.trim().toUpperCase()),
    )

    return Object.freeze({
        pitchShiftCentitones,
        formantWarpingBps,
        vocalFryDensityBps,
        breathinessPauseMultiplierBps,
        remainingBannedCadences: Object.freeze(remainingBannedCadences.sort()),
    })
}
