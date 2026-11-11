import type { PardonRecord } from './pardon.schema.js'

export interface PardonDiagnostic {
    code: string
    pardonId?: string
    ruleId?: string
    message: string
}

export interface PardonValidationResult {
    valid: boolean
    errors: string[]
    warnings: string[]
    appliedPardons: PardonRecord[]
}

export default interface PardonEvaluatorBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        pardons: Map<string, PardonRecord> | Record<string, PardonRecord>
        currentCanonHash: string
        strictFrequencyAudit?: boolean
    }
    slv?: (result: {
        lawBit: { idx: string; val: number; dat: PardonValidationResult }
    }) => void
}
