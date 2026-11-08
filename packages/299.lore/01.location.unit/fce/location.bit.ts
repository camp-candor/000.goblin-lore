import type { Location, Portal } from './spatial.schema.js'

export interface PortalLinkMutation {
    sourceLocationId: string
    targetLocationId: string
    portalSlug: string
    dampingCdB: number
    lineOfSight: boolean
}

export interface ReconcileSpatialLinksPayload {
    seriesSlug: string
    locationId: string
    repoRoot?: string
    dryRun?: boolean
}

export interface ReconcileSpatialLinksReceipt {
    seriesSlug: string
    mutatedFiles: string[]
    injectedPortals: PortalLinkMutation[]
    totalLinksChecked: number
    symmetrical: boolean
    errors?: string[]
}

export default interface LocationBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}
