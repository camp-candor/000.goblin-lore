import type { CompiledEntityRegistry } from '../fce/compileGenesis.bit.js'

export interface PassTwoResult {
    readonly passed: boolean
    readonly error?: string
}

export const executePassTwoGenesisGraph = (
    registry: CompiledEntityRegistry,
): PassTwoResult => {
    const characters = registry.characters
    const locations = registry.locations
    const possessions = registry.possessions
    const grievances = registry.grievances

    // 1. Character referential verification
    for (const [charId, char] of Object.entries(characters)) {
        if (char.staged_location_id && !locations[char.staged_location_id]) {
            return {
                passed: false,
                error: `DANGLING_LOCATION_POINTER: Character '${charId}' references missing location '${char.staged_location_id}'`,
            }
        }

        if (char.inventory) {
            const heldItems = [
                char.inventory.held_primary,
                char.inventory.held_offhand,
            ].filter(Boolean)
            for (const itemId of heldItems) {
                if (!possessions[itemId]) {
                    return {
                        passed: false,
                        error: `DANGLING_ITEM_POINTER: Character '${charId}' holds missing possession '${itemId}'`,
                    }
                }
            }

            // Somatic SAT hand capacity check
            const availableArmsBps = char.somatic?.available_arms_bps ?? 20000
            let totalHandsRequiredBps = 0
            for (const itemId of heldItems) {
                const item = possessions[itemId]
                totalHandsRequiredBps += item.hands_required_bps ?? 10000
            }

            if (totalHandsRequiredBps > availableArmsBps) {
                return {
                    passed: false,
                    error: `SOMATIC_HAND_CAPACITY_OVERFLOW: Character '${charId}' requires ${totalHandsRequiredBps} bps hands but only has ${availableArmsBps} bps available`,
                }
            }
        }
    }

    // 2. Possession custody verification
    for (const [itemId, item] of Object.entries(possessions)) {
        if (item.custody_holder && !characters[item.custody_holder]) {
            return {
                passed: false,
                error: `DANGLING_CUSTODY_POINTER: Possession '${itemId}' custody assigned to missing character '${item.custody_holder}'`,
            }
        }
    }

    // 3. Grievance referential verification
    for (const [grvId, grv] of Object.entries(grievances)) {
        if (grv.location_anchor && !locations[grv.location_anchor]) {
            return {
                passed: false,
                error: `DANGLING_GRIEVANCE_LOCATION: Grievance '${grvId}' anchors to missing location '${grv.location_anchor}'`,
            }
        }

        if (
            grv.physical_anchor_prop &&
            !possessions[grv.physical_anchor_prop]
        ) {
            return {
                passed: false,
                error: `DANGLING_GRIEVANCE_PROP: Grievance '${grvId}' anchors to missing possession '${grv.physical_anchor_prop}'`,
            }
        }

        if (Array.isArray(grv.participants_primary)) {
            for (const participantId of grv.participants_primary) {
                if (!characters[participantId]) {
                    return {
                        passed: false,
                        error: `DANGLING_GRIEVANCE_PARTICIPANT: Grievance '${grvId}' references missing participant '${participantId}'`,
                    }
                }
            }
        }
    }

    // 4. 3-Color DFS DAG Acyclicity Sweep over spawns_on_max_escalation
    const WHITE = 0 // Unvisited
    const GRAY = 1 // Visiting
    const BLACK = 2 // Fully Processed

    const visited: Record<string, number> = {}
    for (const grvId of Object.keys(grievances)) {
        visited[grvId] = WHITE
    }

    const dfs = (nodeId: string, trace: string[]): string | null => {
        visited[nodeId] = GRAY
        trace.push(nodeId)

        const nextNode = grievances[nodeId]?.spawns_on_max_escalation
        if (nextNode && grievances[nextNode]) {
            if (visited[nextNode] === GRAY) {
                return [...trace, nextNode].join(' -> ')
            }
            if (visited[nextNode] === WHITE) {
                const cycle = dfs(nextNode, trace)
                if (cycle) return cycle
            }
        }

        visited[nodeId] = BLACK
        trace.pop()
        return null
    }

    for (const grvId of Object.keys(grievances)) {
        if (visited[grvId] === WHITE) {
            const cycle = dfs(grvId, [])
            if (cycle) {
                return {
                    passed: false,
                    error: `CIRCULAR_GRIEVANCE_DAG_DETECTED: Escalation loop discovered: ${cycle}`,
                }
            }
        }
    }

    return { passed: true }
}
