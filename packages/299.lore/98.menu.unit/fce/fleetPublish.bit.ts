export interface FleetPublishPayload {
    readonly seriesSlug: string
    readonly targetEngineRoot?: string
    readonly targetSpatialRoot?: string
}

export interface FleetPublishReceipt {
    readonly published: boolean
    readonly seriesSlug: string
    readonly engineDestination: string
    readonly spatialDestination: string
    readonly timestamp: string
}

export default interface FleetPublishBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: FleetPublishPayload
    readonly slv?: Function
}
