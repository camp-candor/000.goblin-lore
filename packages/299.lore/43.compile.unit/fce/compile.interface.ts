import type {
    CompileValidationReport,
    StylometricAuditReport,
    OfflineParityReport,
} from './compile.bit'

export default interface Compile {
    idx: string
    status:
        | 'IDLE'
        | 'PASS_1_INGRESS'
        | 'PASS_2_TOPOLOGY'
        | 'PASS_3_SEALING'
        | 'GATE_0_VERIFICATION'
        | 'SEALED'
        | 'FAILED'
    activeSeries: string
    lastMerkleHash: string
    lastCompiledTimestamp: string
    compileCount: number
    entityCatalog: Record<string, any>
    entityHashes: Record<string, string>
    diagnostics: string[]
    lastReport?: CompileValidationReport
    lastStylometricReport?: StylometricAuditReport
    lastOfflineParity?: OfflineParityReport
}
