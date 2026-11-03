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

export const initThreshold = (
    cpy: ThresholdModel,
    bal: ThresholdBit,
    ste: State,
) => {
    debugger
    return cpy
}

export const updateThreshold = (
    cpy: ThresholdModel,
    bal: ThresholdBit,
    ste: State,
) => {
    return cpy
}

import { ThresholdModel } from '../threshold.model'
import ThresholdBit from '../fce/threshold.bit'
import State from '../../99.core/state'
