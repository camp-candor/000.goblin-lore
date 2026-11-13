export interface VoidScanResultBit {
    readonly isVoidState: boolean
    readonly discoveredSlugs: readonly string[]
    readonly repoRoot: string
    readonly seriesPath: string
}

export default interface SeriesDiscoveryBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: VoidScanResultBit
    readonly slv?: Function
}
