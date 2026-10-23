export type GauntletTrapId =
    | 'TRAP_1_UNSCHEMAED_KEY'
    | 'TRAP_2_FLOAT_EPOCH'
    | 'TRAP_3_VERSION_REGRESSION'
    | 'TRAP_4_AUTHORITY_DEMOTION'
    | 'TRAP_5_NON_ASCII_EMOJI'

export interface GauntletTrapResult {
    readonly trapId: GauntletTrapId
    readonly trapDescription: string
    readonly passed: boolean
    readonly caughtErrorCode: string
    readonly diagnosticMessage: string
}

export interface SchemaGauntletSummaryBit {
    readonly totalTraps: 5
    readonly passedTraps: number
    readonly failedTraps: number
    readonly allPassed: boolean
    readonly trapResults: readonly GauntletTrapResult[]
    readonly executionTimeMs: number
}
