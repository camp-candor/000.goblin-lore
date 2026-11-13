export interface VoidScanResultBit {
    readonly isVoidState: boolean
    readonly discoveredSlugs: readonly string[]
    readonly repoRoot: string
    readonly seriesPath: string
}
