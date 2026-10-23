import { PreWriteFactCandidate } from '../val/interceptor.val.js'
import {
    PreWriteValidationResult,
    ExistingFactState,
} from '../fce/interceptor.bit.js'
import {
    interceptPreWriteFact,
    assertPreWriteFact,
} from '../buz/interceptor.buzz.js'

export const InterceptorActions = {
    INTERCEPT_FACT_WRITE: 'database/intercept-fact-write',
    ASSERT_FACT_WRITE: 'database/assert-fact-write',
} as const

export function interceptFactWriteAction(payload: {
    candidate: unknown
    existingState?: ExistingFactState | null
}): PreWriteValidationResult {
    return interceptPreWriteFact(payload.candidate, payload.existingState)
}

export function assertFactWriteAction(payload: {
    candidate: unknown
    existingState?: ExistingFactState | null
}): PreWriteFactCandidate {
    return assertPreWriteFact(payload.candidate, payload.existingState)
}
