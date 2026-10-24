export interface SlugCollisionGuardOptionsBit {
    readonly slug: string
    readonly repoRoot?: string
}

export interface SlugCollisionGuardVacantBit {
    readonly isVacant: true
    readonly slug: string
    readonly seriesPath: string
    readonly compiledPath: string
}

export interface SlugCollisionGuardOccupiedBit {
    readonly isVacant: false
    readonly slug: string
    readonly seriesPath: string
    readonly compiledPath: string
    readonly collidedPaths: readonly string[]
    readonly errorCode: 'CONFLICT_BLOCKED'
    readonly message: string
}

export type SlugCollisionGuardResultBit =
    SlugCollisionGuardVacantBit | SlugCollisionGuardOccupiedBit
