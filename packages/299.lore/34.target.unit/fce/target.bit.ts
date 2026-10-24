export default interface TargetBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}

export type TargetDomain =
    'character' | 'location' | 'possession' | 'grievance' | 'world'

export interface EntityGraphNodeBit {
    readonly id: string
    readonly domain: TargetDomain
    readonly filePath: string
    readonly title: string
    readonly references: readonly string[]
    readonly rawFrontmatter: Record<string, unknown>
}

export interface MultigraphRegistryBit {
    readonly totalNodes: number
    readonly domainCounts: Record<TargetDomain, number>
    readonly nodesById: Record<string, EntityGraphNodeBit>
}
