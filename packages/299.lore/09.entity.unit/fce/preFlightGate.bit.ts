export type LimbStatusType = 'INTACT' | 'IMPAIRED' | 'PARALYZED' | 'AMPUTATED'

export interface SomaticLimbProfile {
    left_arm?: LimbStatusType
    right_arm?: LimbStatusType
    available_arms_bps?: number
}

export interface SomaticSatVerificationReport {
    valid: boolean
    entityId: string
    availableHandsBps: number
    requiredHandsBps: number
    errors: string[]
}

export interface ForeignKeyResolutionReport {
    valid: boolean
    entityId: string
    checkedPointersCount: number
    danglingKeys: string[]
    errors: string[]
}

export interface PreFlightEntityGateReport {
    passed: boolean
    entityId: string
    somatic: SomaticSatVerificationReport
    foreignKeys: ForeignKeyResolutionReport
    errors: string[]
}

export default interface EntityPreFlightGateBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        entityId: string
        frontmatter: Record<string, unknown>
        catalogIds: string[]
        requiredHandsBps?: number
    }
    slv?: (result: {
        entBit: {
            idx: string
            val: number
            dat: PreFlightEntityGateReport
        }
    }) => void
}
