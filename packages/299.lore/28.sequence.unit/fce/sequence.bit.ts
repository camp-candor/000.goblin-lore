import { VersionInteger } from '../val/sequence.val.js'

export default interface SequenceBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}

export interface SequenceStepBit {
    readonly currentVersion: VersionInteger
    readonly proposedVersion: VersionInteger
    readonly claimMutated: boolean
    readonly hashMutated: boolean
}

export interface SequenceVerificationSuccess {
    readonly valid: true
    readonly previousVersion: VersionInteger
    readonly nextVersion: VersionInteger
    readonly stepType: 'INCREMENT_CONTIGUOUS' | 'IDEMPOTENT_MAINTAINED'
    readonly errorCode?: string
    readonly message?: string
    readonly currentVersion?: number
    readonly proposedVersion?: number
}

export interface SequenceVerificationFailure {
    readonly valid: false
    readonly errorCode:
        | 'MONOTONIC_VERSION_REGRESSION_BREACH'
        | 'MONOTONIC_SEQUENCE_GAP_BREACH'
        | 'MUTATION_WITHOUT_VERSION_BUMP_BREACH'
        | 'INVALID_VERSION_INTEGER'
    readonly message: string
    readonly currentVersion: number
    readonly proposedVersion: number
    readonly previousVersion?: VersionInteger
    readonly nextVersion?: VersionInteger
    readonly stepType?: 'INCREMENT_CONTIGUOUS' | 'IDEMPOTENT_MAINTAINED'
}

export type SequenceVerificationResult =
    SequenceVerificationSuccess | SequenceVerificationFailure
