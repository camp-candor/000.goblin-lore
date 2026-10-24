export type EntityDomain =
    'characters' | 'locations' | 'possessions' | 'grievances'

export interface ScratchpadDescriptor {
    readonly entityId: string
    readonly domain: EntityDomain
    readonly seriesSlug: string
    readonly tmpFilePath: string
    readonly canonicalFilePath: string
    readonly initialContent: string
}

export interface GateValidationFailure {
    readonly strike: number
    readonly reason: string
    readonly timestamp: string
}

export interface HumanGateResultPayload {
    readonly success: boolean
    readonly entityId: string
    readonly domain: EntityDomain
    readonly canonicalPath: string
    readonly updatedMerkleRoot?: string
    readonly attempts: number
    readonly trippedCircuitBreaker?: boolean
    readonly error?: string
}

export default interface HumanGateBit {
    readonly idx: string
    readonly src?: string // target series slug
    readonly val?: number
    readonly dat?: {
        readonly entityId: string
        readonly domain: EntityDomain
        readonly seriesSlug?: string
        readonly initialFrontmatter?: Record<string, any>
        readonly result?: HumanGateResultPayload
        readonly error?: string
    }
    readonly slv?: (res: any) => void
}
