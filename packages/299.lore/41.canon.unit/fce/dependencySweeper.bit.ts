import type { EpistemologicalStanding } from './standing.schema.js'

export type DependencyEdgeDomain =
    | 'SCENE_CASTING'
    | 'GRIEVANCE_TARGET'
    | 'SPATIAL_PORTAL'
    | 'POSSESSION_LEASE'
    | 'CANON_FACT'

export interface ActiveDependencyEdge {
    source_id: string
    target_id: string
    domain: DependencyEdgeDomain
    source_standing?: EpistemologicalStanding
    field_path: string
}

export interface DependencySweepReport {
    target_entity_id: string
    retirement_cleared: boolean
    active_in_degree: number
    archived_in_degree_ignored: number
    blocking_references: ActiveDependencyEdge[]
    errorCode?: 'ACTIVE_DEPENDENCY_LOCK'
    reason?: string
}

export interface TransitiveBlastRadiusReport {
    target_entity_id: string
    direct_dependents: string[]
    transitive_dependents: string[]
}

export default interface CanonDependencySweepBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        targetEntityId: string
        edges: ActiveDependencyEdge[]
    }
    slv?: (result: {
        canBit: {
            idx: string
            val: number
            dat: DependencySweepReport
        }
    }) => void
}
