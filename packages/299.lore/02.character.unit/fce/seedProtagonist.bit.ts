export interface SeedProtagonistConfigBit {
    readonly seriesSlug: string
    readonly characterId?: string
    readonly characterName?: string
    readonly locationId?: string
    readonly founderTokenItemId?: string
    readonly surfaceWant?: string
    readonly actualWant?: string
    readonly blindSpot?: string
    readonly voiceNotes?: string
    readonly fewShotLines?: readonly string[]
}

export interface SeedProtagonistResultBit {
    readonly characterId: string
    readonly filePath: string
    readonly byteZeroVerified: boolean
    readonly contentSha256: string
}

export default interface SeedProtagonistBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: SeedProtagonistConfigBit
    readonly slv?: (res: any) => void
}
