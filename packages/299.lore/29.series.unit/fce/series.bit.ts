import type { SeriesConfig } from './series.schema.js'

export interface ScaffoldSeriesTreePayload {
    seriesSlug: string
    config: SeriesConfig
    repoRoot?: string
}

export interface ScaffoldSeriesTreeReceipt {
    seriesSlug: string
    seriesDir: string
    compiledDir: string
    createdDirectories: string[]
    configPath: string
    unresolvedPath: string
    initialized: boolean
}

export default interface SeriesBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}
