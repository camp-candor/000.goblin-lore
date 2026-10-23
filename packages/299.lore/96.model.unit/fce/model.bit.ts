import { FactScope } from '../../38.types.unit/val/scope.val.js'
import { AuthorityLevel } from '../../38.types.unit/val/authority.val.js'
import { TriStateStanding } from '../../38.types.unit/val/standing.val.js'
import { StoredFactNode, RegistryErrorCode } from '../val/model.val.js'

export default interface ModelBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}

export type DeepReadonly<T> = T extends
    Function | boolean | number | string | null | undefined
    ? T
    : { readonly [P in keyof T]: DeepReadonly<T[P]> }

export interface FactNodeBit extends StoredFactNode {}

export interface FactRegistryStatsBit {
    readonly totalFacts: number
    readonly scopeCounts: Readonly<Record<FactScope, number>>
    readonly authorityCounts: Readonly<Record<AuthorityLevel, number>>
    readonly standingCounts: Readonly<Record<TriStateStanding, number>>
    readonly errorLogCount: number
}

export interface RegistryOperationSuccess {
    readonly valid: true
    readonly factId: string
    readonly telemetryMessage: string
    readonly errorCode?: undefined
    readonly message?: undefined
}

export interface RegistryOperationFailure {
    readonly valid: false
    readonly errorCode: RegistryErrorCode
    readonly factId: string
    readonly message: string
}

export type RegistryOperationResult =
    RegistryOperationSuccess | RegistryOperationFailure
