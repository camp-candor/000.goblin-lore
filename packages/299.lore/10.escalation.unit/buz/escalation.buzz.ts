import type EscalationBit from '../fce/escalation.bit'
import type { EscalationModel } from '../escalation.model'
import type {
    EscalationCycleReport,
    EscalationGraphAdjacency,
    NodeColor,
} from '../fce/escalation.schema'
import type State from '../../99.core/state.js'
import {
    resolvePacingBudgetConfig,
    type ActStage,
    type PacingBudgetConfig,
} from '../../38.types.unit/fce/autoScriptRule.interface.js'
import type { DaypartBand } from '../../38.types.unit/fce/chronology.interface.js'

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

export type NarrativeProgressInput =
    | number
    | {
          progressBps?: number
          tick?: number
          totalTicks?: number
          elapsedSolarMinutes?: number
          act_window_mode?: string
      }

export function computeProgressBps(input: NarrativeProgressInput): number {
    if (typeof input === 'number') {
        return Math.trunc(input)
    }
    if (typeof input.progressBps === 'number') {
        return Math.trunc(input.progressBps)
    }
    if (
        typeof input.tick === 'number' &&
        typeof input.totalTicks === 'number' &&
        input.totalTicks > 0
    ) {
        return Math.trunc(
            (Math.trunc(input.tick) * 10000) / Math.trunc(input.totalTicks),
        )
    }
    if (typeof input.elapsedSolarMinutes === 'number') {
        return Math.trunc(
            (Math.trunc(input.elapsedSolarMinutes) * 10000) / 1440,
        )
    }
    return 0
}

export function resolveNarrativeActStage(
    progressInput: NarrativeProgressInput,
    pacingInput?: unknown,
): ActStage {
    const pacing = normalizeEscalationPacing(pacingInput)
    const progressBps = computeProgressBps(progressInput)
    if (progressBps <= pacing.act_i_end_bps) return 'ACT_I'
    if (progressBps <= pacing.act_ii_end_bps) return 'ACT_II'
    return 'ACT_III'
}

function normalizeEscalationPacing(pacingInput?: unknown): PacingBudgetConfig {
    if (
        pacingInput !== null &&
        typeof pacingInput === 'object' &&
        (pacingInput as any).act_i_end_bps !== undefined
    ) {
        return resolvePacingBudgetConfig(pacingInput)
    }
    if (
        pacingInput !== null &&
        typeof pacingInput === 'object' &&
        (pacingInput as any).pacing_budget !== undefined
    ) {
        return resolvePacingBudgetConfig((pacingInput as any).pacing_budget)
    }
    if (pacingInput === undefined || pacingInput === null) {
        return resolvePacingBudgetConfig({})
    }
    try {
        return resolvePacingBudgetConfig(pacingInput)
    } catch {
        return resolvePacingBudgetConfig({})
    }
}

export function computeThreeActPacingMultiplierBps(
    stage: ActStage,
    daypart: DaypartBand,
    pacingInput?: unknown,
): number {
    const pacing = normalizeEscalationPacing(pacingInput)
    const actMult =
        stage === 'ACT_I'
            ? pacing.act_i_multiplier_bps
            : stage === 'ACT_II'
              ? pacing.act_ii_multiplier_bps
              : pacing.act_iii_multiplier_bps
    const diurnalMult = pacing.diurnal_tension_weights_bps[daypart] ?? 10000
    return Number((BigInt(actMult) * BigInt(diurnalMult)) / 10000n)
}
