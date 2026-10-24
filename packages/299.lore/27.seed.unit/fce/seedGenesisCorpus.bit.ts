export interface CreatedSeedDossierBit {
    readonly id: string
    readonly domain: 'locations' | 'possessions' | 'characters' | 'grievances'
    readonly relativePath: string
    readonly absolutePath: string
    readonly byteZeroVerified: boolean
    readonly contentSha256: string
}

export interface SeedGenesisResultBit {
    readonly seriesSlug: string
    readonly dossiers: readonly CreatedSeedDossierBit[]
    readonly totalWritten: number
    readonly error?: string
}

export default interface SeedGenesisCorpusBit {
    readonly idx: string
    readonly src?: string // target series slug
    readonly val?: number
    readonly dat?: {
        readonly seriesSlug?: string
        readonly result?: SeedGenesisResultBit
        readonly error?: string
    }
    readonly slv?: (res: any) => void
}
