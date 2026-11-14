import { assertIntegerMetric } from '../val/postBreak.val.js'

export interface ThresholdValidationResult {
    valueBp: number
    minBp: number
    maxBp: number
    isWithinBounds: boolean
}

export function validateScalarBoundsBuzz(
    valueBp: number,
    minBp: number,
    maxBp: number,
): ThresholdValidationResult {
    assertIntegerMetric(valueBp, 'valueBp')
    assertIntegerMetric(minBp, 'minBp')
    assertIntegerMetric(maxBp, 'maxBp')
    return {
        valueBp,
        minBp,
        maxBp,
        isWithinBounds: valueBp >= minBp && valueBp <= maxBp,
    }
}

export type ThresholdCrossingKind =
    'CROSSED_UP' | 'CROSSED_DOWN' | 'AT_THRESHOLD' | 'BELOW'

export interface ThresholdCrossingResult {
    valueBp: number
    previousValueBp: number
    thresholdBp: number
    crossedUp: boolean
    crossedDown: boolean
    kind: ThresholdCrossingKind
}

function assertBasisPoints(value: number, fieldName: string): void {
    assertIntegerMetric(value, fieldName)
    if (value < 0 || value > 10000) {
        throw new Error(
            `[OUT_OF_BOUNDS] ${fieldName} must be an integer in [0, 10000]. Received: ${value}`,
        )
    }
}

export function evaluateThresholdCrossing(
    valueBp: number,
    previousValueBp: number,
    thresholdBp: number,
): ThresholdCrossingResult {
    assertBasisPoints(valueBp, 'valueBp')
    assertBasisPoints(previousValueBp, 'previousValueBp')
    assertBasisPoints(thresholdBp, 'thresholdBp')
    const crossedUp = previousValueBp < thresholdBp && valueBp >= thresholdBp
    const crossedDown = previousValueBp >= thresholdBp && valueBp < thresholdBp
    let kind: ThresholdCrossingKind = 'BELOW'
    if (crossedUp) {
        kind = 'CROSSED_UP'
    } else if (crossedDown) {
        kind = 'CROSSED_DOWN'
    } else if (valueBp === thresholdBp) {
        kind = 'AT_THRESHOLD'
    } else {
        kind = 'BELOW'
    }
    const receipt: ThresholdCrossingResult = {
        valueBp,
        previousValueBp,
        thresholdBp,
        crossedUp,
        crossedDown,
        kind,
    }
    return Object.freeze(receipt)
}

export const initThreshold = (
    cpy: ThresholdModel,
    bal: ThresholdBit,
    ste?: State,
): ThresholdModel => {
    cpy.idx = bal.idx || '35.threshold'
    if (bal.slv) {
        bal.slv({ trhBit: { idx: 'init-threshold', val: 0 } })
    }
    return cpy
}

export const updateThreshold = (
    cpy: ThresholdModel,
    bal: ThresholdBit,
    ste?: State,
): ThresholdModel => {
    if (bal.slv) {
        bal.slv({ trhBit: { idx: 'update-threshold', val: 0 } })
    }
    return cpy
}

import { ThresholdModel } from '../threshold.model'
import ThresholdBit from '../fce/threshold.bit'
import State from '../../99.core/state'
