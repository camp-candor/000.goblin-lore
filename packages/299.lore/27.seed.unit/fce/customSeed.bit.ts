export interface CustomSeedIdentifiers {
    readonly characterId?: string
    readonly locationId?: string
    readonly possessionId?: string
    readonly grievanceId?: string
}

export interface CustomSeedConfigBit {
    readonly seriesSlug: string
    readonly customIdentifiers?: CustomSeedIdentifiers
    readonly repoRoot?: string
}

export interface CustomSeedResultBit {
    readonly seriesSlug: string
    readonly injectedIds: CustomSeedIdentifiers
    readonly totalInjected: number
    readonly byteZeroVerified: boolean
}

export default interface CustomSeedBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: CustomSeedConfigBit
    readonly slv?: Function
}
