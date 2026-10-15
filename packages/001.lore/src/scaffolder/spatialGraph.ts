export interface SpatialNode {
    id: string // loc_*
    connected_locations: string[]
}

export interface SpatialValidationResult {
    valid: boolean
    errors: Array<{
        sourceLocation: string
        targetLocation: string
        message: string
    }>
}

/**
 * Verifies and enforces bidirectional spatial adjacency links.
 * Prohibits "One-Way Trap" defects at compile time (T_0 = $0.00).
 */
export function validateReciprocalSpatialTopology(
    locations: Map<string, SpatialNode>,
): SpatialValidationResult {
    const errors: SpatialValidationResult['errors'] = []

    for (const [locId, node] of locations.entries()) {
        for (const neighborId of node.connected_locations) {
            const neighbor = locations.get(neighborId)
            if (!neighbor) {
                errors.push({
                    sourceLocation: locId,
                    targetLocation: neighborId,
                    message: `Location '${locId}' links to unknown destination '${neighborId}'.`,
                })
                continue
            }

            if (!neighbor.connected_locations.includes(locId)) {
                errors.push({
                    sourceLocation: locId,
                    targetLocation: neighborId,
                    message: `Asymmetric spatial topology: '${locId}' connects to '${neighborId}', but '${neighborId}' lacks reciprocal return link.`,
                })
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Automatically establishes reciprocal links across location nodes in memory.
 */
export function wireReciprocalAdjacency(
    locA: SpatialNode,
    locB: SpatialNode,
): void {
    if (!locA.connected_locations.includes(locB.id)) {
        locA.connected_locations.push(locB.id)
    }
    if (!locB.connected_locations.includes(locA.id)) {
        locB.connected_locations.push(locA.id)
    }
}
