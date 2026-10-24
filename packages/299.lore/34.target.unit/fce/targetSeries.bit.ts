export interface EntityCountRecord {
    readonly characters: number
    readonly locations: number
    readonly possessions: number
    readonly grievances: number
    readonly total: number
}

export interface TargetSeriesPayload {
    readonly seriesSlug: string
    readonly displayName: string
    readonly genreTag:
        'LOW_FANTASY_FARCE' | 'SOUTHERN_GOTHIC_INDUSTRIAL' | 'HARD_SCIFI_VACUUM'
    readonly themeColor: 'green' | 'yellow' | 'cyan'
    readonly seriesConfig: Readonly<Record<string, any>>
    readonly merkleRoot: string
    readonly entityCounts: EntityCountRecord
    readonly sowerEngineSynced: boolean
}

export interface TargetSeriesBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        seriesSlug?: string
        result?: TargetSeriesPayload
        error?: string
        cancelled?: boolean
    }
    slv?: (val: any) => void
}
