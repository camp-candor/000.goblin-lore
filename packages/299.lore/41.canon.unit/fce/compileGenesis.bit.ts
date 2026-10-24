export interface CompiledEntityRegistry {
    readonly characters: Record<string, any>
    readonly locations: Record<string, any>
    readonly possessions: Record<string, any>
    readonly grievances: Record<string, any>
}

export interface CanonicalBibleState {
    readonly _meta: {
        readonly schema_version: '1.0.0'
        readonly series_slug: string
        readonly compiled_at_utc: string
        readonly entity_counts: {
            readonly characters: number
            readonly locations: number
            readonly possessions: number
            readonly grievances: number
            readonly total: number
        }
        readonly state_hash: string
    }
    readonly series_config: any
    readonly entities: CompiledEntityRegistry
}

export interface GenesisCompilerPassReceipt {
    readonly passNumber: 1 | 2 | 3
    readonly passName: string
    readonly passed: boolean
    readonly durationMs: number
    readonly details: Record<string, any>
}

export interface GenesisSealResultBit {
    readonly seriesSlug: string
    readonly merkleRoot: string
    readonly canonicalHeadPath: string
    readonly wormArchivePath: string
    readonly totalEntities: number
    readonly passReceipts?: readonly GenesisCompilerPassReceipt[]
    readonly error?: string
}

export default interface CompileGenesisBit {
    readonly idx: string
    readonly src?: string // target series slug
    readonly val?: number
    readonly dat?: {
        readonly seriesSlug?: string
        readonly result?: GenesisSealResultBit
        readonly error?: string
    }
    readonly slv?: (res: any) => void
}
