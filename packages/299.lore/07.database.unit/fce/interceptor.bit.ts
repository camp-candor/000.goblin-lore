import {
    PreWriteErrorCode,
    PreWriteFactCandidate,
} from '../val/interceptor.val.js'

export interface PreWriteValidationSuccess {
    readonly valid: true
    readonly sanitizedCandidate: PreWriteFactCandidate
    readonly operationType: 'INSERT' | 'UPDATE'
    readonly telemetryMessage: string
    readonly errorCode?: undefined
    readonly message?: undefined
}

export interface PreWriteValidationFailure {
    readonly valid: false
    readonly errorCode: PreWriteErrorCode
    readonly factId: string
    readonly message: string
}

export type PreWriteValidationResult =
    PreWriteValidationSuccess | PreWriteValidationFailure

export interface ExistingFactState {
    readonly id: string
    readonly claim_text: string
    readonly scope: string
    readonly authority_level: string
    readonly standing: string
    readonly version: number
    readonly content_hash: string
}
