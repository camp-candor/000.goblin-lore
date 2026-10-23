import {
    SomaticDeltaInputSchema,
    SomaticTraumaReceiptSchema,
    type SomaticDeltaInput,
    type SomaticTraumaReceipt,
    type LocomotionTier,
} from '../val/somaticDelta.val'
import { calculateCompoundTraumaLimbClamping } from '../../40.wound.unit/buz/wound.buzz'
import type { LocomotionBaseline } from '../../40.wound.unit/val/wound.val'
import { calculateSensoryAcuityProfile } from './sensory.buzz'
import { calculateVocalDspProfile } from './vocalDsp.buzz'

export const assertIntegerMetric = (val: number, label: string): void => {
    if (!Number.isInteger(val)) {
        throw new Error(
            `[FLOAT_PROHIBITED] ${label} must be integer scalar. Received: ${val}`,
        )
    }
}

export const clampBps = (val: number, label: string): number => {
    assertIntegerMetric(val, label)
    return Math.max(0, Math.min(10000, val))
}

export const deriveLocomotionTier = (
    legsAvailable: number,
    painBps: number,
    motorLimitations: readonly string[],
): LocomotionTier => {
    if (legsAvailable <= 0 || painBps >= 9000) return 'IMMOBILIZED'
    if (
        legsAvailable === 1 ||
        painBps >= 5000 ||
        motorLimitations.includes('UNSTEADY_GAIT') ||
        motorLimitations.includes('LIMP')
    ) {
        return 'LIMPING'
    }
    return 'UNRESTRICTED'
}

export const createDefaultSomaticReceipt = (
    entityId: string,
    locomotionBaseline: LocomotionBaseline = 'bipedal_standard',
): SomaticTraumaReceipt => {
    const limbReceipt = calculateCompoundTraumaLimbClamping({
        entityId,
        locomotionBaseline,
        conditions: [],
    })

    const sensoryProfile = calculateSensoryAcuityProfile({
        entityId,
        conditions: [],
    })

    const vocalDspProfile = calculateVocalDspProfile({
        entityId,
        conditions: [],
    })

    return {
        entityId,
        armsAvailable: limbReceipt.armsAvailable,
        availableArmsBps: limbReceipt.availableArmsBps,
        legsAvailable: 2,
        locomotionTier: 'UNRESTRICTED',
        fatigueBps: 0,
        painBps: 0,
        refusalStrainBps: 0,
        isRefusalStrained: false,
        activeConditions: [],
        motorLimitations: [],
        signatureTics: [],
        limbReceipt,
        sensoryProfile,
        vocalDspProfile,
        updatedAtTick: 0,
    }
}

/**
 * Resolves a character's somatic trauma delta by computing compound limb capacity,
 * sensory acuity debuffs, vocal DSP modifiers, and integer strain meters.
 */
export const calculateSomaticDeltaResolution = (
    current: SomaticTraumaReceipt,
    delta: SomaticDeltaInput,
): SomaticTraumaReceipt => {
    const parsed = SomaticDeltaInputSchema.parse(delta)

    // 1. Reconcile active conditions
    const conditionsSet = new Set<string>(
        current.activeConditions.map((c) => c.toLowerCase()),
    )
    for (const c of parsed.conditionsAdded) {
        conditionsSet.add(c.trim().toLowerCase())
    }
    for (const c of parsed.conditionsRemoved) {
        conditionsSet.delete(c.trim().toLowerCase())
    }
    const activeConditions = Array.from(conditionsSet).sort()

    // 2. Reconcile motor limitations
    const motorSet = new Set<string>(
        current.motorLimitations.map((m) => m.toUpperCase()),
    )
    for (const m of parsed.motorLimitationsAdded) {
        motorSet.add(m.trim().toUpperCase())
    }
    for (const m of parsed.motorLimitationsRemoved) {
        motorSet.delete(m.trim().toUpperCase())
    }
    const motorLimitations = Array.from(motorSet).sort()

    // 3. Reconcile signature tics
    const ticsSet = new Set<string>(current.signatureTics)
    for (const t of parsed.signatureTicsAdded) {
        ticsSet.add(t.trim())
    }
    for (const t of parsed.signatureTicsRemoved) {
        ticsSet.delete(t.trim())
    }
    const signatureTics = Array.from(ticsSet).sort()

    // 4. Compute clamped strain meters in integer basis points
    const fatigueBps = clampBps(
        current.fatigueBps + parsed.deltaFatigueBps,
        'fatigueBps',
    )
    const painBps = clampBps(current.painBps + parsed.deltaPainBps, 'painBps')
    const refusalStrainBps = clampBps(
        current.refusalStrainBps + parsed.deltaRefusalStrainBps,
        'refusalStrainBps',
    )
    const isRefusalStrained = refusalStrainBps >= 8000

    // 5. Compute leg availability
    const rawLegs = current.legsAvailable + parsed.deltaLegs
    const legsAvailable = Math.max(0, Math.min(2, rawLegs))

    // 6. Derive locomotion tier
    const locomotionTier = deriveLocomotionTier(
        legsAvailable,
        painBps,
        motorLimitations,
    )

    // 7. Invoke cross-unit sub-systems
    const limbReceipt = calculateCompoundTraumaLimbClamping({
        entityId: parsed.entityId,
        locomotionBaseline: parsed.locomotionBaseline,
        conditions: activeConditions,
    })

    const sensoryProfile = calculateSensoryAcuityProfile({
        entityId: parsed.entityId,
        conditions: activeConditions,
    })

    const vocalDspProfile = calculateVocalDspProfile({
        entityId: parsed.entityId,
        conditions: activeConditions,
    })

    const receipt: SomaticTraumaReceipt = {
        entityId: parsed.entityId,
        armsAvailable: limbReceipt.armsAvailable,
        availableArmsBps: limbReceipt.availableArmsBps,
        legsAvailable,
        locomotionTier,
        fatigueBps,
        painBps,
        refusalStrainBps,
        isRefusalStrained,
        activeConditions,
        motorLimitations,
        signatureTics,
        limbReceipt,
        sensoryProfile,
        vocalDspProfile,
        updatedAtTick:
            parsed.tick > 0 ? parsed.tick : current.updatedAtTick + 1,
    }

    return SomaticTraumaReceiptSchema.parse(receipt)
}
