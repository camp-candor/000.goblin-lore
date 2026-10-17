import { GrievanceMachineRail } from '../schemas/grievance.js'

export interface DagAcyclicityResult {
    isAcyclic: boolean
    cycleNodes: string[]
    topologicalDepths: Map<string, number>
    maxDepth: number
    reason?: string
}

enum DfsColor {
    WHITE = 0, // Unvisited
    GRAY = 1, // Currently in recursion stack
    BLACK = 2, // Fully processed
}

/**
 * Executes Three-Color Depth-First Search (DFS) over grievance escalation links:
 * spawns_on_max_escalation
 */
export function verifyGrievanceDag(
    grievances: GrievanceMachineRail[],
): DagAcyclicityResult {
    const adj = new Map<string, string[]>()
    const allNodes = new Set<string>()

    for (const g of grievances) {
        allNodes.add(g.id)
        adj.set(g.id, g.spawns_on_max_escalation)
    }

    const colors = new Map<string, DfsColor>()
    for (const node of allNodes) {
        colors.set(node, DfsColor.WHITE)
    }

    const cycleNodes: string[] = []
    const topologicalDepths = new Map<string, number>()

    function dfs(node: string, currentStack: string[]): boolean {
        colors.set(node, DfsColor.GRAY)
        currentStack.push(node)

        const neighbors = adj.get(node) || []
        for (const neighbor of neighbors) {
            if (!allNodes.has(neighbor)) {
                // Target node missing from corpus
                continue
            }
            const neighborColor = colors.get(neighbor)
            if (neighborColor === DfsColor.GRAY) {
                // Back-edge found -> Cycle detected
                cycleNodes.push(
                    ...currentStack.slice(currentStack.indexOf(neighbor)),
                    neighbor,
                )
                return false
            }
            if (neighborColor === DfsColor.WHITE) {
                if (!dfs(neighbor, currentStack)) {
                    return false
                }
            }
        }

        currentStack.pop()
        colors.set(node, DfsColor.BLACK)
        return true
    }

    for (const node of allNodes) {
        if (colors.get(node) === DfsColor.WHITE) {
            if (!dfs(node, [])) {
                return {
                    isAcyclic: false,
                    cycleNodes,
                    topologicalDepths: new Map(),
                    maxDepth: 0,
                    reason: `CIRCULAR_ESCALATION_DETECTED: Cycle detected along path: [${cycleNodes.join(' -> ')}]`,
                }
            }
        }
    }

    // Calculate topological depth delta for each node
    const memoDepth = new Map<string, number>()

    function calculateDepth(node: string): number {
        if (memoDepth.has(node)) return memoDepth.get(node)!
        const neighbors = adj.get(node) || []
        if (neighbors.length === 0) {
            memoDepth.set(node, 0)
            return 0
        }
        let maxChildDepth = 0
        for (const neighbor of neighbors) {
            if (allNodes.has(neighbor)) {
                maxChildDepth = Math.max(
                    maxChildDepth,
                    1 + calculateDepth(neighbor),
                )
            }
        }
        memoDepth.set(node, maxChildDepth)
        return maxChildDepth
    }

    let maxDepth = 0
    for (const node of allNodes) {
        const depth = calculateDepth(node)
        topologicalDepths.set(node, depth)
        maxDepth = Math.max(maxDepth, depth)
    }

    return {
        isAcyclic: true,
        cycleNodes: [],
        topologicalDepths,
        maxDepth,
    }
}
