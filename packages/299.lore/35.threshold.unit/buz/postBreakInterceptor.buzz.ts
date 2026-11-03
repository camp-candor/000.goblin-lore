import {
    ThresholdEvaluationInputSchema,
    assertIntegerMetric,
    type ThresholdEvaluationInput,
} from '../val/postBreak.val.js'
import { executeAttenuationFenceLift } from './liftAttenuationFence.buzz.js'
import { sealPermanentAcousticProfile } from './sealPermanentAcousticDelta.buzz.js'
import type { PostBreakReceipt } from '../val/postBreak.val.js'

export interface ThresholdInterceptionResult {
    isBreached: boolean
    receipt: PostBreakReceipt | null
}

export function evaluateThresholdBreachInterception(
    input: ThresholdEvaluationInput,
    activeAcousticProfile?: {
        pitchShiftCentitones: number
        formantWarpingBps: number
        vocalFryDensityBps: number
        breathinessPauseMultiplierBps: number
        bannedCadences: readonly string[]
    },
    currentAttenuationTokens: readonly string[] = [],
): ThresholdInterceptionResult {
    const parsed = ThresholdEvaluationInputSchema.parse(input)
    assertIntegerMetric(parsed.currentValueBp, 'currentValueBp')
    assertIntegerMetric(parsed.thresholdLimitBp, 'thresholdLimitBp')
    assertIntegerMetric(parsed.tick, 'tick')

    // Failure occurs when currentValueBp >= thresholdLimitBp
    if (parsed.currentValueBp < parsed.thresholdLimitBp) {
        return {
            isBreached: false,
            receipt: null,
        }
    }

    // Step 1: Halt active cycle & Step 2: Commit PostBreakMutation
    // Step 3 & 4: Lift verbal attenuation fences
    const fenceReceipt = executeAttenuationFenceLift(
        parsed.entityId,
        currentAttenuationTokens,
        parsed.mutationDirective.bannedTokensRemoved,
    )

    // Step 4b: Seal permanent acoustic deltas
    const baseProfile = activeAcousticProfile || {
        pitchShiftCentitones: 0,
        formantWarpingBps: 10000,
        vocalFryDensityBps: 0,
        breathinessPauseMultiplierBps: 10000,
        bannedCadences: [],
    }

    const acousticReceipt = sealPermanentAcousticProfile(
        baseProfile,
        parsed.mutationDirective.permanentAcousticDeltas,
    )

    // Step 5: Force dramatic climax scene directive
    const receipt: PostBreakReceipt = {
        entityId: parsed.entityId,
        meterId: parsed.meterId,
        category: parsed.category,
        breachedValueBp: parsed.currentValueBp,
        thresholdLimitBp: parsed.thresholdLimitBp,
        targetRefusalVectorId: parsed.mutationDirective.targetRefusalVectorId,
        terminalConditionAdded: parsed.mutationDirective.terminalConditionAdded,
        bannedTokensRemoved: fenceReceipt.tokensRemoved,
        updatedAcousticProfile: {
            pitchShiftCentitones: acousticReceipt.pitchShiftCentitones,
            formantWarpingBps: acousticReceipt.formantWarpingBps,
            vocalFryDensityBps: acousticReceipt.vocalFryDensityBps,
            breathinessPauseMultiplierBps:
                acousticReceipt.breathinessPauseMultiplierBps,
            remainingBannedCadences: acousticReceipt.remainingBannedCadences,
        },
        climaxSceneDirective: parsed.mutationDirective.climaxSceneDirective,
        isHaltRequired: true,
        updatedAtTick: parsed.tick,
    }

    return {
        isBreached: true,
        receipt: Object.freeze(receipt),
    }
}
