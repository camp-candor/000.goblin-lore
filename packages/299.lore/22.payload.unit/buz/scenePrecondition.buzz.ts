export interface PinnedFactDependency {
    fact_id: string
    entity_id: string
    pinned_version: number
    current_version: number
    property_key?: string
    pinned_value?: string
    current_value?: string
}

export interface ScenePreconditionPayload {
    scene_id: string
    series_slug: string
    scene_bible_merkle_hash: string
    sealed_root_merkle_hash: string
    is_dirty?: number
    fact_dependencies: PinnedFactDependency[]
    required_kinetic_verbs?: string[]
    banned_kinetic_verbs?: string[]
}

export interface DirtyDependencyCollision {
    fact_id: string
    entity_id: string
    reason_code:
        | 'DIRTY_FLAG_ACTIVE'
        | 'PINNED_VERSION_STALE'
        | 'MONOTONIC_VERSION_REGRESSION'
        | 'SOMATIC_VERB_REVOKED'
    pinned_version: number
    current_version: number
    detail: string
}

export interface DirtySceneRejectionReceipt {
    error: 'DIRTY_SCENE_REJECTED'
    http_status: 412
    scene_id: string
    series_slug: string
    dirty_dependencies: number
    merkle_delta: {
        pinned_hash: string
        current_hash: string
        matches: boolean
    }
    collisions: DirtyDependencyCollision[]
    message: string
}

export type ScenePreconditionVerdict =
    | {
          admitted: true
          http_status: 200
          scene_id: string
          series_slug: string
          merkle_verified: true
      }
    | {
          admitted: false
          http_status: 412
          receipt: DirtySceneRejectionReceipt
      }

export function evaluateSceneSomaticStaleness(
    payload: ScenePreconditionPayload,
): ScenePreconditionVerdict {
    const collisions: DirtyDependencyCollision[] = []
    const merkleMatches =
        Boolean(payload.scene_bible_merkle_hash) &&
        payload.scene_bible_merkle_hash === payload.sealed_root_merkle_hash

    if (payload.is_dirty === 1) {
        collisions.push({
            fact_id: 'scene_dirty_flag',
            entity_id: payload.scene_id,
            reason_code: 'DIRTY_FLAG_ACTIVE',
            pinned_version: 0,
            current_version: 1,
            detail: `Scene '${payload.scene_id}' carries active is_dirty = 1 flag in dependency ledger`,
        })
    }

    for (const dep of payload.fact_dependencies || []) {
        if (dep.pinned_version < dep.current_version) {
            collisions.push({
                fact_id: dep.fact_id,
                entity_id: dep.entity_id,
                reason_code: 'PINNED_VERSION_STALE',
                pinned_version: dep.pinned_version,
                current_version: dep.current_version,
                detail: `Fact '${dep.fact_id}' on '${dep.entity_id}' pinned at v${dep.pinned_version} behind live v${dep.current_version}`,
            })
        } else if (dep.pinned_version > dep.current_version) {
            collisions.push({
                fact_id: dep.fact_id,
                entity_id: dep.entity_id,
                reason_code: 'MONOTONIC_VERSION_REGRESSION',
                pinned_version: dep.pinned_version,
                current_version: dep.current_version,
                detail: `Monotonic version anomaly on '${dep.fact_id}': pinned v${dep.pinned_version} > live v${dep.current_version}`,
            })
        }
    }

    const bannedSet = new Set(payload.banned_kinetic_verbs || [])
    if (
        bannedSet.has('*') &&
        (payload.required_kinetic_verbs || []).length > 0
    ) {
        collisions.push({
            fact_id: 'somatic_tombstone_lock',
            entity_id: payload.scene_id,
            reason_code: 'SOMATIC_VERB_REVOKED',
            pinned_version: 1,
            current_version: 1,
            detail: `Scene '${payload.scene_id}' invokes kinetic verbs on a departed entity (banned_kinetic_verbs: ['*'])`,
        })
    } else {
        for (const verb of payload.required_kinetic_verbs || []) {
            if (bannedSet.has(verb)) {
                collisions.push({
                    fact_id: `somatic_verb_${verb}`,
                    entity_id: payload.scene_id,
                    reason_code: 'SOMATIC_VERB_REVOKED',
                    pinned_version: 1,
                    current_version: 1,
                    detail: `Kinetic verb '${verb}' is banned in live somatic canon for '${payload.scene_id}'`,
                })
            }
        }
    }

    if (!merkleMatches || collisions.length > 0) {
        return {
            admitted: false,
            http_status: 412,
            receipt: {
                error: 'DIRTY_SCENE_REJECTED',
                http_status: 412,
                scene_id: payload.scene_id,
                series_slug: payload.series_slug,
                dirty_dependencies: Math.max(
                    collisions.length,
                    merkleMatches ? 0 : 1,
                ),
                merkle_delta: {
                    pinned_hash: payload.scene_bible_merkle_hash,
                    current_hash: payload.sealed_root_merkle_hash,
                    matches: merkleMatches,
                },
                collisions,
                message:
                    'Upstream canon changed. Re-lint and re-compile scene AST before queuing render.',
            },
        }
    }

    return {
        admitted: true,
        http_status: 200,
        scene_id: payload.scene_id,
        series_slug: payload.series_slug,
        merkle_verified: true,
    }
}
