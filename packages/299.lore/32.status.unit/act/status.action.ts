import { StandingTransitionInput } from '../val/status.val.js'
import { LiminalTransitionResult } from '../fce/status.bit.js'
import {
    evaluateLiminalStandingTransition,
    assertLiminalStandingTransition,
} from '../buz/status.buzz.js'

export const StatusActions = {
    VALIDATE_LIMINAL_TRANSITION: 'status/validate-liminal-transition',
    ASSERT_LIMINAL_TRANSITION: 'status/assert-liminal-transition',
} as const

export function validateLiminalTransitionAction(
    payload: StandingTransitionInput,
): LiminalTransitionResult {
    return evaluateLiminalStandingTransition(payload)
}

export function assertLiminalTransitionAction(
    payload: StandingTransitionInput,
): void {
    assertLiminalStandingTransition(payload)
}
