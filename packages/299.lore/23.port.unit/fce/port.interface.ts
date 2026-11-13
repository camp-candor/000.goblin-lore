export interface BibleClientOptions {
    repoRoot?: string
}

export interface BibleStateEnvelope {
    schema_version: string
    series_slug: string
    root_merkle_hash: string
    compiled_at?: string
    catalog_summary: Record<string, any>
    entity_hashes: Record<string, string>
    entities: Record<string, any>
}

export interface SpatialPortalEdge {
    source_location_id: string
    target_location_id: string
    portal_slug: string
    damping_cdb: number
    line_of_sight: boolean
}

export interface StaticSpatialGraph {
    series_slug: string
    root_merkle_hash: string
    locations: Record<string, any>
    edges: SpatialPortalEdge[]
}

export default interface Port {
    idx?: string
}
