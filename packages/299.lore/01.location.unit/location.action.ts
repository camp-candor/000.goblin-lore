import { Action } from '../99.core/interface/action.interface'
import LocationBit from './fce/location.bit'

// Location actions

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

export type Actions = InitLocation | UpdateLocation

export const RECONCILE_RECIPROCAL_SPATIAL_LINKS =
    'location/RECONCILE_RECIPROCAL_SPATIAL_LINKS'

export interface ReconcileReciprocalLinksPayload {
    readonly sourceLocationId: string
    readonly targetLocationId: string
}
