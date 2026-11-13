import * as crypto from 'node:crypto'

export interface LocalStagedDraft {
    draft_id: string
    series_slug: string
    entity_id: string
    author_id: string
    base_h_root: string
    base_h_dep: string
    foreign_key_ids: string[]
    markdown_payload: string
    status: string
}

export interface LocalStagingDrainBundle {
    series_slug: string
    trunk_h_root: string
    drained_at_ms: number
    drafts: LocalStagedDraft[]
}

export interface DrainPartitionReport {
    accepted: LocalStagedDraft[]
    quarantined: Array<{ draft_id: string; entity_id: string; reason: string }>
}

export function computeLocalDependencyHash(
    targetEntityId: string,
    foreignKeyIds: string[],
    entityHashes: Record<string, string>,
): string {
    const uniqueIds = Array.from(
        new Set([targetEntityId, ...foreignKeyIds]),
    ).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
    const canonicalInput = uniqueIds
        .map((id) => `${id}:${entityHashes[id] || 'MISSING_ENTITY_HASH'}`)
        .join('|')
    return crypto
        .createHash('sha256')
        .update(canonicalInput, 'utf8')
        .digest('hex')
}

export function filterDrainableDrafts(
    bundle: LocalStagingDrainBundle,
    localEntityHashes: Record<string, string>,
): DrainPartitionReport {
    const accepted: LocalStagedDraft[] = []
    const quarantined: Array<{
        draft_id: string
        entity_id: string
        reason: string
    }> = []

    for (const draft of bundle.drafts) {
        if (draft.status !== 'OPEN') {
            quarantined.push({
                draft_id: draft.draft_id,
                entity_id: draft.entity_id,
                reason: `[INVALID_DRAFT_STATUS] Draft status is '${draft.status}'`,
            })
            continue
        }

        const expectedDep = computeLocalDependencyHash(
            draft.entity_id,
            draft.foreign_key_ids || [],
            localEntityHashes,
        )

        if (draft.base_h_dep !== expectedDep) {
            quarantined.push({
                draft_id: draft.draft_id,
                entity_id: draft.entity_id,
                reason: `[STALE_CANON_REBASE_REQUIRED] H_dep mismatch for '${draft.entity_id}'`,
            })
            continue
        }

        accepted.push(draft)
    }

    return { accepted, quarantined }
}
