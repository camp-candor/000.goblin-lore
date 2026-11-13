import type {
    ActiveDependencyEdge,
    DependencySweepReport,
    TransitiveBlastRadiusReport,
    default as CanonDependencySweepBit,
} from '../fce/dependencySweeper.bit.js'
import type { CanonModel } from '../canon.model.js'
import type State from '../../99.core/state.js'

const ENTITY_ID_PATTERN = /^[a-z]+_[a-z0-9_]+$/

export function buildReverseAdjacencyIndex(
    edges: ActiveDependencyEdge[],
): Map<string, ActiveDependencyEdge[]> {
    const revAdj = new Map<string, ActiveDependencyEdge[]>()
    for (const edge of edges) {
        const bucket = revAdj.get(edge.target_id) || []
        bucket.push(edge)
        revAdj.set(edge.target_id, bucket)
    }
    return revAdj
}

export function sweepActiveDependencies(
    targetEntityId: string,
    edges: ActiveDependencyEdge[],
): DependencySweepReport {
    if (!ENTITY_ID_PATTERN.test(targetEntityId)) {
        throw new Error(
            `[INVALID_ENTITY_ID] Target '${targetEntityId}' must match ^[a-z]+_[a-z0-9_]+$`,
        )
    }

    const revAdj = buildReverseAdjacencyIndex(edges)
    const inboundEdges = revAdj.get(targetEntityId) || []

    const activeBlockers: ActiveDependencyEdge[] = []
    let archivedIgnored = 0

    for (const edge of inboundEdges) {
        if (edge.source_standing === 'DEPRECATED_ARCHIVED') {
            archivedIgnored++
            continue
        }
        activeBlockers.push(edge)
    }

    activeBlockers.sort((a, b) => {
        if (a.source_id !== b.source_id) {
            return a.source_id < b.source_id ? -1 : 1
        }
        if (a.field_path !== b.field_path) {
            return a.field_path < b.field_path ? -1 : 1
        }
        return 0
    })

    if (activeBlockers.length > 0) {
        const sampleRefs = activeBlockers
            .slice(0, 3)
            .map((b) => `${b.source_id}(${b.domain})`)
            .join(', ')

        return {
            target_entity_id: targetEntityId,
            retirement_cleared: false,
            active_in_degree: activeBlockers.length,
            archived_in_degree_ignored: archivedIgnored,
            blocking_references: activeBlockers,
            errorCode: 'ACTIVE_DEPENDENCY_LOCK',
            reason: `Cannot retire '${targetEntityId}': ${activeBlockers.length} active reference(s) remain [${sampleRefs}]`,
        }
    }

    return {
        target_entity_id: targetEntityId,
        retirement_cleared: true,
        active_in_degree: 0,
        archived_in_degree_ignored: archivedIgnored,
        blocking_references: [],
    }
}

export function sweepCorpusBlastRadius(
    targetEntityId: string,
    edges: ActiveDependencyEdge[],
): TransitiveBlastRadiusReport {
    if (!ENTITY_ID_PATTERN.test(targetEntityId)) {
        throw new Error(
            `[INVALID_ENTITY_ID] Target '${targetEntityId}' must match ^[a-z]+_[a-z0-9_]+$`,
        )
    }

    const revAdj = buildReverseAdjacencyIndex(edges)
    const directSet = new Set<string>()
    const transitiveSet = new Set<string>()
    const visited = new Set<string>([targetEntityId])
    const queue: Array<{ nodeId: string; depth: number }> = [
        { nodeId: targetEntityId, depth: 0 },
    ]

    while (queue.length > 0) {
        const current = queue.shift()!
        const inbound = revAdj.get(current.nodeId) || []

        for (const edge of inbound) {
            if (edge.source_standing === 'DEPRECATED_ARCHIVED') continue

            if (current.depth === 0) {
                directSet.add(edge.source_id)
            }

            if (!visited.has(edge.source_id)) {
                visited.add(edge.source_id)
                transitiveSet.add(edge.source_id)
                queue.push({ nodeId: edge.source_id, depth: current.depth + 1 })
            }
        }
    }

    const sortLex = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0)

    return {
        target_entity_id: targetEntityId,
        direct_dependents: Array.from(directSet).sort(sortLex),
        transitive_dependents: Array.from(transitiveSet).sort(sortLex),
    }
}

export const sweepActiveDependenciesAction = (
    cpy: CanonModel,
    bal: CanonDependencySweepBit,
    ste?: State,
): CanonModel => {
    const dat = bal?.dat
    if (!dat || !dat.targetEntityId) {
        if (bal?.slv) {
            bal.slv({
                canBit: {
                    idx: bal?.idx || 'sweep-active-dependencies-err',
                    val: 0,
                    dat: {
                        target_entity_id: '',
                        retirement_cleared: false,
                        active_in_degree: 0,
                        archived_in_degree_ignored: 0,
                        blocking_references: [],
                        errorCode: 'ACTIVE_DEPENDENCY_LOCK',
                        reason: '[MISSING_ARGS] targetEntityId and edges are required',
                    },
                },
            })
        }
        return cpy
    }

    const report = sweepActiveDependencies(dat.targetEntityId, dat.edges || [])
    if (bal?.slv) {
        bal.slv({
            canBit: {
                idx: bal.idx || 'sweep-active-dependencies',
                val: report.retirement_cleared ? 1 : 0,
                dat: report,
            },
        })
    }
    return cpy
}
