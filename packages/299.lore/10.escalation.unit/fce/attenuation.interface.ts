import { AttenuationDirective } from '../val/attenuation.val'

export interface AttenuationViolationBit {
    readonly leaked_lemma: string
    readonly match_index: number
    readonly matched_span: string
}

export interface AttenuationScanResultBit {
    readonly passed: boolean
    readonly actor_id: string
    readonly suppression_factor_bps: number
    readonly violations: readonly AttenuationViolationBit[]
    readonly tactical_proxies: readonly string[]
    readonly errorCode?:
        'NONE' | 'ATTENUATION_MASK_VIOLATION' | 'SCHEMA_VALIDATION_ERROR'
    readonly reason?: string
}

export default interface AttenuationRegistry {
    idx: string
    directives: Record<string, AttenuationDirective>
}
