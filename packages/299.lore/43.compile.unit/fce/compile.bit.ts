export type CompileActionType =
    | 'full-compile'
    | 'pass1-only'
    | 'pass2-only'
    | 'pass3-only'
    | 'gate0-gauntlet'
    | 'offline-deletion-test'
    | 'stylometric-lint'

export interface CompileCatalogSummary {
    characters: number
    locations: number
    items: number
    grievances: number
    mysteries: number
    totalEntities: number
    characterCount?: number
    locationCount?: number
    possessionCount?: number
    grievanceCount?: number
    mysteryCount?: number
}

export interface CompileValidationReport {
    byte0Compliant: boolean
    ascii7BitCompliant: boolean
    schemaValid: boolean
    somaticSatValid: boolean
    foreignKeysValid: boolean
    grievanceDagAcyclic: boolean
    spatialPortalsReciprocal: boolean
    acousticAttenuationValid?: boolean
    clueLemmaDisjoint: boolean
    atomicWriteVerified: boolean
    deepFreezeVerified: boolean
    errors: string[]
    evaluatedFiles?: number
    failures?: Array<{ gate: string; message: string; targetFile?: string }>
    warnings?: string[]
}

export interface StylometricAuditReport {
    passed: boolean
    scannedEntities: number
    slopViolations: string[]
    voiceBleedCollisions: string[]
    averageLexicalDiversityBp: number
}

export interface OfflineParityReport {
    parityVerified: boolean
    initialHash: string
    rebuiltHash: string
    purgedFilesCount: number
}

export default interface CompileBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: (val: any) => void
    actionType?: CompileActionType
    seriesSlug?: string
    outputDir?: string
    emitTelemetry?: boolean
    rootMerkleHash?: string
    entityHashes?: Record<string, string>
    canonicalPath?: string
    archivePath?: string
    executionDurationMs?: number
    catalogSummary?: CompileCatalogSummary
    validationReport?: CompileValidationReport
    stylometricReport?: StylometricAuditReport
    offlineParityReport?: OfflineParityReport
}
