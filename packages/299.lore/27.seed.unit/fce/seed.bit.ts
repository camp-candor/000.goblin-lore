export interface CreatedSeedDossier {
    id: string
    domain: 'world' | 'locations' | 'characters' | 'possessions' | 'grievances'
    relativePath: string
    absolutePath: string
    byteZeroVerified: boolean
    contentSha256: string
}

export interface PopulateGenesisSeedsPayload {
    seriesSlug: string
    repoRoot?: string
    overrideConditions?: string
    overrideEconomy?: string
}

export interface PopulateGenesisSeedsReceipt {
    seriesSlug: string
    seededFiles: CreatedSeedDossier[]
    totalSeeded: number
    initialized: boolean
    error?: string
}

export default interface SeedBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}
