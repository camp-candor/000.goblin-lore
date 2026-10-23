import {
    VocalDspModifierInputSchema,
    VocalDspModifierProfileSchema,
    LARYNGEAL_TRAUMA_CONDITIONS,
    PULMONARY_TRAUMA_CONDITIONS,
    HYPOTHERMIA_SHOCK_CONDITIONS,
    NEUROPATHY_SPINAL_CONDITIONS,
    type VocalDspModifierInput,
    type VocalDspModifierProfile,
    type BannedCadence,
} from '../val/vocalDsp.val'

const LARYNGEAL_SET = new Set<string>(
    LARYNGEAL_TRAUMA_CONDITIONS.map((c) => c.toLowerCase()),
)
const PULMONARY_SET = new Set<string>(
    PULMONARY_TRAUMA_CONDITIONS.map((c) => c.toLowerCase()),
)
const HYPOTHERMIA_SET = new Set<string>(
    HYPOTHERMIA_SHOCK_CONDITIONS.map((c) => c.toLowerCase()),
)
const NEUROPATHY_SET = new Set<string>(
    NEUROPATHY_SPINAL_CONDITIONS.map((c) => c.toLowerCase()),
)

export const assertIntegerMetric = (val: number, label: string): void => {
    if (!Number.isInteger(val)) {
        throw new Error(
            `[FLOAT_PROHIBITED] ${label} must be integer scalar. Received: ${val}`,
        )
    }
}

/**
 * Derives the deterministic vocal DSP modifier profile from canonical somatic trauma conditions.
 */
export const calculateVocalDspProfile = (
    input: VocalDspModifierInput,
): VocalDspModifierProfile => {
    const parsed = VocalDspModifierInputSchema.parse(input)

    // Validate integer metrics if explicitly supplied
    if (parsed.explicitPitchShiftCentitones !== undefined) {
        assertIntegerMetric(
            parsed.explicitPitchShiftCentitones,
            'explicitPitchShiftCentitones',
        )
    }
    if (parsed.explicitFormantWarpingBps !== undefined) {
        assertIntegerMetric(
            parsed.explicitFormantWarpingBps,
            'explicitFormantWarpingBps',
        )
    }
    if (parsed.explicitSpeedMultiplierBps !== undefined) {
        assertIntegerMetric(
            parsed.explicitSpeedMultiplierBps,
            'explicitSpeedMultiplierBps',
        )
    }
    if (parsed.explicitBreathinessPauseBps !== undefined) {
        assertIntegerMetric(
            parsed.explicitBreathinessPauseBps,
            'explicitBreathinessPauseBps',
        )
    }
    if (parsed.explicitVocalFryDensityBps !== undefined) {
        assertIntegerMetric(
            parsed.explicitVocalFryDensityBps,
            'explicitVocalFryDensityBps',
        )
    }

    const matchedAcousticConditions: string[] = []
    const cadencesSet = new Set<BannedCadence>(
        parsed.explicitBannedCadences ?? [],
    )

    let hasLaryngeal = false
    let hasPulmonary = false
    let hasHypothermia = false
    let hasNeuropathy = false

    for (const rawCond of parsed.conditions) {
        const normalized = rawCond.trim().toLowerCase()
        if (LARYNGEAL_SET.has(normalized)) {
            matchedAcousticConditions.push(normalized)
            hasLaryngeal = true
        }
        if (PULMONARY_SET.has(normalized)) {
            matchedAcousticConditions.push(normalized)
            hasPulmonary = true
        }
        if (HYPOTHERMIA_SET.has(normalized)) {
            matchedAcousticConditions.push(normalized)
            hasHypothermia = true
        }
        if (NEUROPATHY_SET.has(normalized)) {
            matchedAcousticConditions.push(normalized)
            hasNeuropathy = true
        }
    }

    // Baseline parameter defaults
    let pitchShiftCentitones = parsed.explicitPitchShiftCentitones ?? 0
    let formantWarpingBps = parsed.explicitFormantWarpingBps ?? 10000
    let speedMultiplierBps = parsed.explicitSpeedMultiplierBps ?? 10000
    let breathinessPauseMultiplierBps =
        parsed.explicitBreathinessPauseBps ?? 10000
    let vocalFryDensityBps = parsed.explicitVocalFryDensityBps ?? 0

    // Somatic trauma deltas application
    if (hasLaryngeal) {
        if (parsed.explicitFormantWarpingBps === undefined)
            formantWarpingBps = 7000
        if (parsed.explicitPitchShiftCentitones === undefined)
            pitchShiftCentitones -= 400
        if (parsed.explicitVocalFryDensityBps === undefined)
            vocalFryDensityBps = Math.min(10000, vocalFryDensityBps + 4500)
        cadencesSet.add('RAPID_STACCATO')
        cadencesSet.add('RISING_INFLECTION_INTERROGATIVE')
    }

    if (hasPulmonary) {
        if (parsed.explicitBreathinessPauseBps === undefined)
            breathinessPauseMultiplierBps = 22000
        if (parsed.explicitSpeedMultiplierBps === undefined)
            speedMultiplierBps = Math.min(speedMultiplierBps, 8500)
        cadencesSet.add('RAPID_STACCATO')
        cadencesSet.add('UPBEAT_LILT')
    }

    if (hasHypothermia) {
        if (parsed.explicitPitchShiftCentitones === undefined)
            pitchShiftCentitones += 250
        if (parsed.explicitVocalFryDensityBps === undefined)
            vocalFryDensityBps = Math.min(10000, vocalFryDensityBps + 8000)
    }

    if (hasNeuropathy) {
        if (parsed.explicitPitchShiftCentitones === undefined)
            pitchShiftCentitones -= 200
        if (parsed.explicitSpeedMultiplierBps === undefined)
            speedMultiplierBps = Math.min(speedMultiplierBps, 8500)
        if (parsed.explicitBreathinessPauseBps === undefined)
            breathinessPauseMultiplierBps = Math.max(
                breathinessPauseMultiplierBps,
                18000,
            )
    }

    // Clamping sanity limits
    pitchShiftCentitones = Math.max(-1200, Math.min(1200, pitchShiftCentitones))
    formantWarpingBps = Math.max(5000, Math.min(20000, formantWarpingBps))
    speedMultiplierBps = Math.max(1000, Math.min(30000, speedMultiplierBps))
    breathinessPauseMultiplierBps = Math.max(
        10000,
        Math.min(35000, breathinessPauseMultiplierBps),
    )
    vocalFryDensityBps = Math.max(0, Math.min(10000, vocalFryDensityBps))

    const profile: VocalDspModifierProfile = {
        entityId: parsed.entityId,
        pitchShiftCentitones,
        formantWarpingBps,
        speedMultiplierBps,
        breathinessPauseMultiplierBps,
        vocalFryDensityBps,
        hasLaryngealTrauma: hasLaryngeal,
        hasPulmonaryTrauma: hasPulmonary,
        bannedCadences: Array.from(cadencesSet).sort(),
        matchedAcousticConditions,
    }

    return VocalDspModifierProfileSchema.parse(profile)
}
