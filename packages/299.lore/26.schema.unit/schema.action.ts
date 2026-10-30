import type { Action } from '../99.core/interface/action.interface'
import type SchemaBit from './fce/schema.bit'

export const INIT_SCHEMA = '[Schema action] Init Schema'
export class InitSchema implements Action<SchemaBit> {
    readonly type = INIT_SCHEMA
    constructor(public bale: SchemaBit) {}
}

export const UPDATE_SCHEMA = '[Schema action] Update Schema'
export class UpdateSchema implements Action<SchemaBit> {
    readonly type = UPDATE_SCHEMA
    constructor(public bale: SchemaBit) {}
}

export const VALIDATE_ENTITY = '[Schema action] Validate Entity'
export class ValidateEntity implements Action<SchemaBit> {
    readonly type = VALIDATE_ENTITY
    constructor(public bale: SchemaBit) {}
}

export const SOLVE_SOMATIC_SAT = '[Schema action] Solve Somatic Sat'
export class SolveSomaticSat implements Action<SchemaBit> {
    readonly type = SOLVE_SOMATIC_SAT
    constructor(public bale: SchemaBit) {}
}

export type Actions =
    InitSchema | UpdateSchema | ValidateEntity | SolveSomaticSat
