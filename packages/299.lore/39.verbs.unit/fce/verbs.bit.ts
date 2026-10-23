import type {
    CompiledSomaticMask,
    KineticAuditQuery,
    KineticAuditReceipt,
    LocomotionTier,
} from '../val/verbs.val'

export default interface VerbsBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}

export interface CompileMaskPayload {
    entityId: string
    conditions?: string[]
    availableArmsBps?: number
    legsAvailable?: number
    locomotionTier?: LocomotionTier
    explicitBannedVerbs?: string[]
}

export interface AuditQueryPayload extends KineticAuditQuery {}
