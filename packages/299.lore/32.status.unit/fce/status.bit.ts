import { TriStateStanding } from '../../38.types.unit/val/standing.val.js'

export default interface StatusBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}

export interface LiminalTransitionSuccess {
    readonly valid: true
    readonly fromStanding: TriStateStanding
    readonly toStanding: TriStateStanding
    readonly triggersCascade: boolean
    readonly versionIncrementRequired: boolean
    readonly transitionCategory:
        | 'ENTER_LIMINAL_REVIEW'
        | 'REVERT_STILL_GOOD'
        | 'FORMAL_RETIREMENT'
        | 'IDEMPOTENT_MAINTAINED'
    readonly telemetryMessage: string
    readonly errorCode?: string
    readonly message?: string
}

export interface LiminalTransitionFailure {
    readonly valid: false
    readonly errorCode:
        | 'LIMINAL_CONTENT_MUTATION_BREACH'
        | 'UNVERSIONED_DEPRECATION_BREACH'
        | 'ILLEGAL_ARCHIVED_TRANSITION_BREACH'
        | 'INVALID_TRANSITION_PAYLOAD'
    readonly message: string
    readonly fromStanding?: TriStateStanding
    readonly toStanding?: TriStateStanding
    readonly triggersCascade?: boolean
    readonly versionIncrementRequired?: boolean
    readonly transitionCategory?:
        | 'ENTER_LIMINAL_REVIEW'
        | 'REVERT_STILL_GOOD'
        | 'FORMAL_RETIREMENT'
        | 'IDEMPOTENT_MAINTAINED'
    readonly telemetryMessage?: string
}

export type LiminalTransitionResult =
    LiminalTransitionSuccess | LiminalTransitionFailure
