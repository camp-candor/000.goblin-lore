export interface TrunkCanonSealSnapshot {
    series_slug: string
    commit_sha: string
    schema_version: string
    h_root: string
    entity_hashes: Record<string, string>
    sealed_at_ms: number
}

export interface EntityMutexLease {
    entity_id: string
    holder_id: string
    acquired_at_ms: number
    expires_at_ms: number
}

export type StagedDraftStatus =
    'OPEN' | 'REBASE_REQUIRED' | 'DRAINED' | 'EVICTED_TTL'

export interface StagedDraftProposal {
    draft_id: string
    series_slug: string
    entity_id: string
    author_id: string
    base_h_root: string
    base_h_dep: string
    foreign_key_ids: string[]
    markdown_payload: string
    created_at_ms: number
    updated_at_ms: number
    status: StagedDraftStatus
}

export interface StagingDrainBundle {
    series_slug: string
    trunk_h_root: string
    drained_at_ms: number
    drafts: StagedDraftProposal[]
}
