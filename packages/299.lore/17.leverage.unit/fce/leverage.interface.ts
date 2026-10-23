import {
    StringsLedgerRecord,
    CharacterLeverageVector,
} from '../val/leverage.val'

export interface LeverageVerificationErrorBit {
    readonly holder_id: string
    readonly target_id: string
    readonly errorCode:
        | 'ANTI_REFLEXIVITY_BREACH'
        | 'DANGLING_LEVERAGE_TARGET'
        | 'INSUFFICIENT_STRINGS_BREACH'
        | 'FLOAT_PROHIBITED'
    readonly reason: string
}

export interface LeverageDirectoryIndexResultBit {
    readonly success: boolean
    readonly total_characters_scanned: number
    readonly total_directed_edges: number
    readonly records: readonly StringsLedgerRecord[]
    readonly errors: readonly LeverageVerificationErrorBit[]
}

export interface SpendLeverageResultBit {
    readonly success: boolean
    readonly relation_id: string
    readonly remaining_strings_count: number
    readonly errorCode?: string
    readonly reason?: string
}

export default interface Leverage {
    idx: string
    records: Record<string, StringsLedgerRecord> // Keyed by relation_id
    character_vectors: Record<string, CharacterLeverageVector>
    errors: LeverageVerificationErrorBit[]
}
