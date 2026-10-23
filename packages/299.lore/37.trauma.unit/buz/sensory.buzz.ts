import {
    SensoryAcuityInputSchema,
    SensoryAcuityProfileSchema,
    OCULAR_CONDITIONS_CATALOG,
    ACOUSTIC_TRAUMA_CONDITIONS,
    type SensoryAcuityInput,
    type SensoryAcuityProfile,
    type OpticalState,
} from '../val/sensory.val'

const BLIND_SET = new Set<string>(
    OCULAR_CONDITIONS_CATALOG.blind.map((c) => c.toLowerCase()),
)
const MONOCULAR_SET = new Set<string>(
    OCULAR_CONDITIONS_CATALOG.monocular.map((c) => c.toLowerCase()),
)
const ACOUSTIC_SET = new Set<string>(
    ACOUSTIC_TRAUMA_CONDITIONS.map((c) => c.toLowerCase()),
)

export const assertIntegerMetric = (val: number, label: string): void => {
    if (!Number.isInteger(val)) {
        throw new Error(
            `[FLOAT_PROHIBITED] ${label} must be integer scalar. Received: ${val}`,
        )
    }
}

/**
 * Derives the deterministic sensory acuity profile from an actor's conditions.
 */
export const calculateSensoryAcuityProfile = (
    input: SensoryAcuityInput,
): SensoryAcuityProfile => {
    const parsed = SensoryAcuityInputSchema.parse(input)

    // Validate integer metrics if explicitly supplied
    if (parsed.explicitBlindConeDegrees !== undefined) {
        assertIntegerMetric(
            parsed.explicitBlindConeDegrees,
            'explicitBlindConeDegrees',
        )
    }
    if (parsed.explicitVisualAcuityBps !== undefined) {
        assertIntegerMetric(
            parsed.explicitVisualAcuityBps,
            'explicitVisualAcuityBps',
        )
    }
    if (parsed.explicitAuditoryDebuffCdB !== undefined) {
        assertIntegerMetric(
            parsed.explicitAuditoryDebuffCdB,
            'explicitAuditoryDebuffCdB',
        )
    }

    const matchedOcularConditions: string[] = []
    const matchedAcousticConditions: string[] = []

    let isBlind = false
    let isMonocular = false

    for (const rawCond of parsed.conditions) {
        const normalized = rawCond.trim().toLowerCase()
        if (BLIND_SET.has(normalized)) {
            matchedOcularConditions.push(normalized)
            isBlind = true
        } else if (MONOCULAR_SET.has(normalized)) {
            matchedOcularConditions.push(normalized)
            isMonocular = true
        }

        if (ACOUSTIC_SET.has(normalized)) {
            matchedAcousticConditions.push(normalized)
        }
    }

    // Determine Optical State
    let opticalState: OpticalState = 'NORMAL'
    if (parsed.explicitOpticalState) {
        opticalState = parsed.explicitOpticalState
    } else if (isBlind) {
        opticalState = 'BLIND'
    } else if (isMonocular) {
        opticalState = 'MONOCULAR'
    }

    // Derive Blind Cone Degrees & Visual Acuity Basis Points
    let blindConeDegrees = 0
    let visualAcuityBps = 10000 // 100.00% standard

    if (opticalState === 'BLIND') {
        blindConeDegrees = parsed.explicitBlindConeDegrees ?? 360
        visualAcuityBps = parsed.explicitVisualAcuityBps ?? 0
    } else if (opticalState === 'MONOCULAR') {
        blindConeDegrees = parsed.explicitBlindConeDegrees ?? 60
        visualAcuityBps = parsed.explicitVisualAcuityBps ?? 5000 // 50.00% acuity
    } else {
        blindConeDegrees = parsed.explicitBlindConeDegrees ?? 0
        visualAcuityBps = parsed.explicitVisualAcuityBps ?? 10000
    }

    // Derive Auditory Debuff in Centi-Decibels (+1,500 cdB per condition)
    let auditoryFloorDebuffCdB = 0
    if (parsed.explicitAuditoryDebuffCdB !== undefined) {
        auditoryFloorDebuffCdB = parsed.explicitAuditoryDebuffCdB
    } else {
        const penaltyUnits = matchedAcousticConditions.length
        auditoryFloorDebuffCdB = Math.min(10000, penaltyUnits * 1500)
    }

    const hasAcousticTrauma = auditoryFloorDebuffCdB > 0

    const profile: SensoryAcuityProfile = {
        entityId: parsed.entityId,
        opticalState,
        blindConeDegrees,
        visualAcuityBps,
        auditoryFloorDebuffCdB,
        hasAcousticTrauma,
        matchedOcularConditions,
        matchedAcousticConditions,
    }

    return SensoryAcuityProfileSchema.parse(profile)
}
