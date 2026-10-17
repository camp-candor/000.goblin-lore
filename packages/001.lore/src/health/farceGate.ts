import { GrievanceMachineRail } from '../schemas/grievance.js'

export interface FarceGateResult {
    valid: boolean
    totalGrievances: number
    farceGrievancesCount: number
    farceRatioBps: number // Integer basis points (1500 = 15%)
    clueCollisions: Array<{ grievanceId: string; propId: string }>
    reason?: string
}

/**
 * Enforces R_farce <= 0.15 (1500 bps) and prop clue-disjointness at Stage T0 = $0.00
 */
export function auditFarceRatio(
    grievances: GrievanceMachineRail[],
    permittedClues: string[] = [],
): FarceGateResult {
    const totalGrievances = grievances.length
    if (totalGrievances === 0) {
        return {
            valid: true,
            totalGrievances: 0,
            farceGrievancesCount: 0,
            farceRatioBps: 0,
            clueCollisions: [],
        }
    }

    const clueSet = new Set(permittedClues.map((c) => c.toLowerCase()))
    const farceGrievances = grievances.filter((g) => g.tonal_override_eligible)
    const farceGrievancesCount = farceGrievances.length

    // Integer basis-point arithmetic: (count * 10000) / total
    const farceRatioBps = Math.round(
        (farceGrievancesCount * 10000) / totalGrievances,
    )

    const clueCollisions: Array<{ grievanceId: string; propId: string }> = []

    for (const farce of farceGrievances) {
        for (const prop of farce.bound_props) {
            if (clueSet.has(prop.toLowerCase())) {
                clueCollisions.push({ grievanceId: farce.id, propId: prop })
            }
        }
    }

    if (clueCollisions.length > 0) {
        return {
            valid: false,
            totalGrievances,
            farceGrievancesCount,
            farceRatioBps,
            clueCollisions,
            reason: `FARCE_CLUE_COLLISION: Farce disputes bind secret mystery clues: [${clueCollisions.map((c) => c.propId).join(', ')}]`,
        }
    }

    if (farceRatioBps > 1500) {
        return {
            valid: false,
            totalGrievances,
            farceGrievancesCount,
            farceRatioBps,
            clueCollisions,
            reason: `FARCE_RATIO_BREACH: Farce ratio of ${farceRatioBps / 100.0}% exceeds 15.00% ceiling.`,
        }
    }

    return {
        valid: true,
        totalGrievances,
        farceGrievancesCount,
        farceRatioBps,
        clueCollisions: [],
    }
}
