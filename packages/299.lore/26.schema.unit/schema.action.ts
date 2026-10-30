/**
 * packages/299.lore/26.schema.unit/schema.action.ts
 *
 * Action constant definitions and strongly-typed envelope class constructors
 * for 26.schema.unit. Governs dispatch signatures across the simulation bus.
 */

import type { Action } from '../99.core/interface/action.interface'
import type SchemaBit from './fce/schema.bit'

// ----------------------------------------------------------------------------
// :: Action Constant Definitions
// ----------------------------------------------------------------------------

export const INIT_SCHEMA = '[Schema action] Init Schema'
export const UPDATE_SCHEMA = '[Schema action] Update Schema'
export const VALIDATE_ENTITY = '[Schema action] Validate Entity'
export const SOLVE_SOMATIC_SAT = '[Schema action] Solve Somatic Sat'

// ----------------------------------------------------------------------------
// :: Action Envelope Class Constructors
// ----------------------------------------------------------------------------

export class InitSchema implements Action<SchemaBit> {
    readonly type = INIT_SCHEMA
    constructor(public bale: SchemaBit) {
        Object.freeze(this)
    }
}

export class UpdateSchema implements Action<SchemaBit> {
    readonly type = UPDATE_SCHEMA
    constructor(public bale: SchemaBit) {
        Object.freeze(this)
    }
}

export class ValidateEntity implements Action<SchemaBit> {
    readonly type = VALIDATE_ENTITY
    constructor(public bale: SchemaBit) {
        Object.freeze(this)
    }
}

export class SolveSomaticSat implements Action<SchemaBit> {
    readonly type = SOLVE_SOMATIC_SAT
    constructor(public bale: SchemaBit) {
        Object.freeze(this)
    }
}

// ----------------------------------------------------------------------------
// :: Discriminated Actions Union
// ----------------------------------------------------------------------------

export type Actions =
    InitSchema | UpdateSchema | ValidateEntity | SolveSomaticSat

export default Actions
