export type SomaticTrapId =
    | 'TRAP_1_FLOAT_METRIC_PROHIBITED'
    | 'TRAP_2_UNSCHEMAED_KEY_CLOSURE'
    | 'TRAP_3_APHONIC_DELIVERY_BREACH'
    | 'TRAP_4_MONOTONIC_VERSION_REGRESSION'
    | 'TRAP_5_RFC8785_HASH_PARITY_BREACH'

export interface SomaticTrapResult {
    readonly trapId: SomaticTrapId
    readonly stageLabel: string
    readonly passed: boolean
    readonly caughtExceptionSignature: string
    readonly executionLatencyMs: number
}

export interface SomaticGauntletSummary {
    readonly seed: number
    readonly totalTraps: number
    readonly trapsPassed: number
    readonly isCertified: boolean
    readonly totalLatencyMs: number
    readonly results: readonly SomaticTrapResult[]
}

export default interface PayloadGauntletBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        seed?: number
    }
    slv?: (result: {
        payloadBit: {
            idx: string
            val: number
            dat: Readonly<SomaticGauntletSummary>
        }
    }) => void
}
