export interface TopologyExportPayload {
    readonly seriesSlug: string
    readonly targetSpatialRoot?: string
}

export interface TopologyExportReceipt {
    readonly exported: boolean
    readonly seriesSlug: string
    readonly spatialDestination: string
    readonly nodeCount: number
    readonly timestamp: string
}

export default interface TopologyExportBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: TopologyExportPayload
    readonly slv?: Function
}
