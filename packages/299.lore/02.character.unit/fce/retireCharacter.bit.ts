export type DepartureType =
    'death' | 'estrangement' | 'missing' | 'destruction' | 'unresolved_absence'

export interface RetireCharacterConfigBit {
    readonly seriesSlug: string
    readonly characterId: string
    readonly departureType: DepartureType
    readonly resolutionCause: string
    readonly retiredAtCycle: number
    readonly customRoot?: string
}

export interface PreFlightRetireAuditResultBit {
    readonly canRetireSafely: boolean
    readonly blockingReferences: readonly string[]
    readonly heldPossessions: readonly string[]
    readonly activeLeverageHolders: readonly string[]
    readonly unresolvedGrievances: readonly string[]
}

export interface RetireCharacterResultBit {
    readonly characterId: string
    readonly oldPath: string
    readonly newPath: string
    readonly byteZeroVerified: boolean
    readonly tombstoneHash: string
    readonly reconciledReferencesCount: number
}

export default interface RetireCharacterBit {
    readonly idx: string
    readonly src?: string
    readonly val?: number
    readonly dat?: RetireCharacterConfigBit
    readonly slv?: (res: any) => void
}
