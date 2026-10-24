import { Action } from '../99.core/interface/action.interface.js'
import LocationBit from './fce/location.bit.js'
import type LocationScaffoldBit from './fce/locationScaffold.bit.js'

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

export const SCAFFOLD_LOCATION_WIZARD =
    '[Location action] Scaffold Location Wizard'
export class ScaffoldLocationWizard implements Action {
    readonly type = SCAFFOLD_LOCATION_WIZARD
    constructor(public bale: LocationScaffoldBit) {}
}

export type Actions = InitLocation | UpdateLocation | ScaffoldLocationWizard

export const RECONCILE_RECIPROCAL_SPATIAL_LINKS =
    'location/RECONCILE_RECIPROCAL_SPATIAL_LINKS'

export interface ReconcileReciprocalLinksPayload {
    readonly sourceLocationId: string
    readonly targetLocationId: string
}
