import type { Action } from '../99.core/interface/action.interface.js'
import type LocationBit from './fce/location.bit.js'

export const INIT_LOCATION = '[Location action] Init Location'
export class InitLocation implements Action {
    readonly type = INIT_LOCATION
    constructor(public bale: LocationBit) {}
}

export const UPDATE_LOCATION = '[Location action] Update Location'
export class UpdateLocation implements Action {
    readonly type = UPDATE_LOCATION
    constructor(public bale: LocationBit) {}
}

export const RECONCILE_RECIPROCAL_LINKS =
    '[Location action] Reconcile Reciprocal Links'
export class ReconcileReciprocalLinks implements Action {
    readonly type = RECONCILE_RECIPROCAL_LINKS
    constructor(public bale: LocationBit) {}
}

export type Actions = InitLocation | UpdateLocation | ReconcileReciprocalLinks
