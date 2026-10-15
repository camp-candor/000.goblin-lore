import { Grievance } from '../schemas/grievance.js'

export interface FarceGateConfig {
    max_farce_ratio: number // default: 0.15 (15%)
    min_farce_ratio: number // default: 0.05 (5%)
}

export interface FarceAuditResult {
    passed: boolean
    farceRatio: number
    totalGrievances: number
    farceGrievances: number
    violations: Array<{
        code:
            | 'TONAL_DEGRADATION_BREACH'
            | 'FARCE_CHILD_SPAWN_BREACH'
            | 'FARCE_INTENSITY_EXCEEDED'
            | 'FARCE_EPISTEMIC_COLLISION'
        grievanceId?: string
        message: string
    }>
}

export class FarceGate {
    private config: FarceGateConfig

    constructor(config?: Partial<FarceGateConfig>) {
        this.config = {
            max_farce_ratio: config?.max_farce_ratio ?? 0.15,
            min_farce_ratio: config?.min_farce_ratio ?? 0.05,
        }
    }

    /**
     * Audits the Farce Ratio and structural DAG constraints across all grievances.
     */
    public auditFarceInvariants(
        grievances: Grievance[],
        clueTokens: string[] = [],
    ): FarceAuditResult {
        const totalGrievances = grievances.length
        const violations: FarceAuditResult['violations'] = []
        const clueSet = new Set(clueTokens.map((c) => c.toLowerCase()))

        if (totalGrievances === 0) {
            return {
                passed: true,
                farceRatio: 0,
                totalGrievances: 0,
                farceGrievances: 0,
                violations: [],
            }
        }

        const farceGrievancesList = grievances.filter(
            (g) => g.tonal_override_eligible,
        )
        const farceRatio = farceGrievancesList.length / totalGrievances

        // 1. Ratio Ceiling Assertion
        if (farceRatio > this.config.max_farce_ratio) {
            violations.push({
                code: 'TONAL_DEGRADATION_BREACH',
                message: `Farce ratio ${(farceRatio * 100).toFixed(1)}% exceeds configured ceiling ${(this.config.max_farce_ratio * 100).toFixed(1)}%.`,
            })
        }

        // 2. Individual Farce Invariant Verification
        for (const g of farceGrievancesList) {
            // Must not spawn escalation children (must be terminal leaf)
            if (g.spawns_on_max_escalation.length > 0) {
                violations.push({
                    code: 'FARCE_CHILD_SPAWN_BREACH',
                    grievanceId: g.id,
                    message: `Farce grievance '${g.id}' cannot spawn escalation children (${g.spawns_on_max_escalation.join(', ')}). Must be terminal leaf.`,
                })
            }

            // Max intensity must not exceed 2
            if (g.intensity_envelope.max > 2) {
                violations.push({
                    code: 'FARCE_INTENSITY_EXCEEDED',
                    grievanceId: g.id,
                    message: `Farce grievance '${g.id}' max intensity (${g.intensity_envelope.max}) exceeds ceiling of 2.`,
                })
            }

            // Farce props must not collide with mystery clue tokens
            for (const prop of g.associated_props) {
                if (clueSet.has(prop.toLowerCase())) {
                    violations.push({
                        code: 'FARCE_EPISTEMIC_COLLISION',
                        grievanceId: g.id,
                        message: `Farce prop '${prop}' in '${g.id}' collides with canonical mystery clue token.`,
                    })
                }
            }
        }

        return {
            passed: violations.length === 0,
            farceRatio,
            totalGrievances,
            farceGrievances: farceGrievancesList.length,
            violations,
        }
    }
}
