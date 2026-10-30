import type EscalationBit from '../fce/escalation.bit'
import type { EscalationModel } from '../escalation.model'
import type {
    EscalationCycleReport,
    EscalationGraphAdjacency,
    NodeColor,
} from '../fce/escalation.schema'
import type State from '../../99.core/state'

/**
 * Three-Color Depth-First Search Cycle Detector.
 * WHITE: Unvisited node
 * GRAY: Node on active recursion stack (back-edge target -> cycle)
 * BLACK: Node fully explored and confirmed acyclic
 */
export const detectEscalationCycles = (
    adjacency: EscalationGraphAdjacency,
): EscalationCycleReport => {
    const color = new Map<string, NodeColor>()
    const parent = new Map<string, string | null>()
    const allNodes = Object.keys(adjacency)

    for (const node of allNodes) {
        color.set(node, 'WHITE')
        parent.set(node, null)
    }

    let cycleDetected = false
    let cycleStartNode: string | null = null
    let cycleEndNode: string | null = null

    const dfs = (u: string) => {
        color.set(u, 'GRAY')

        const neighbors = adjacency[u] || []
        for (const v of neighbors) {
            if (!color.has(v)) {
                // Unknown external reference handled by referential integrity gate
                continue
            }

            if (color.get(v) === 'GRAY') {
                cycleDetected = true
                cycleStartNode = v
                cycleEndNode = u
                return
            }

            if (color.get(v) === 'WHITE') {
                parent.set(v, u)
                dfs(v)
                if (cycleDetected) return
            }
        }

        color.set(u, 'BLACK')
    }

    for (const node of allNodes) {
        if (color.get(node) === 'WHITE') {
            dfs(node)
            if (cycleDetected) break
        }
    }

    if (cycleDetected && cycleStartNode && cycleEndNode) {
        const cyclePath: string[] = [cycleStartNode]
        let curr = cycleEndNode

        while (curr !== cycleStartNode) {
            cyclePath.unshift(curr)
            curr = parent.get(curr) || cycleStartNode
        }
        cyclePath.unshift(cycleStartNode)

        return {
            hasCycle: true,
            cyclePath,
            error: `CYCLE_DETECTED: Recursive escalation loop discovered -> ${cyclePath.join(' -> ')}`,
        }
    }

    return {
        hasCycle: false,
    }
}

/**
 * Assigns integer topological depth delta(v) = 1 + max(delta(parent)), delta(root) = 0.
 * Requires that adjacency has already passed detectEscalationCycles.
 */
export const computeTopologicalDepth = (
    adjacency: EscalationGraphAdjacency,
): Record<string, number> => {
    const depths: Record<string, number> = {}
    const inDegree: Record<string, number> = {}
    const allNodes = Object.keys(adjacency)

    for (const node of allNodes) {
        inDegree[node] = 0
    }

    for (const u of allNodes) {
        for (const v of adjacency[u] || []) {
            if (inDegree[v] !== undefined) {
                inDegree[v]++
            }
        }
    }

    const memoDepth = (node: string, visited: Set<string>): number => {
        if (depths[node] !== undefined) return depths[node]
        if (visited.has(node)) return 0 // Guard against unhandled cycles

        visited.add(node)
        let maxParentDepth = -1

        for (const u of allNodes) {
            const children = adjacency[u] || []
            if (children.includes(node)) {
                const pDepth = memoDepth(u, new Set(visited))
                if (pDepth > maxParentDepth) {
                    maxParentDepth = pDepth
                }
            }
        }

        const calculated = maxParentDepth === -1 ? 0 : maxParentDepth + 1
        depths[node] = calculated
        return calculated
    }

    for (const node of allNodes) {
        memoDepth(node, new Set())
    }

    return depths
}

export const initEscalation = (
    cpy: EscalationModel,
    bal: EscalationBit,
    _ste: State,
) => {
    if (bal?.slv) {
        bal.slv({ idx: 'init-escalation', val: 0 })
    }
    return cpy
}

export const updateEscalation = (
    cpy: EscalationModel,
    bal: EscalationBit,
    _ste: State,
) => {
    if (bal?.slv) {
        bal.slv({ idx: 'update-escalation', val: 0 })
    }
    return cpy
}
