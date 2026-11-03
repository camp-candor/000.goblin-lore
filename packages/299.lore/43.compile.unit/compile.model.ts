import type Compile from './fce/compile.interface'
import type {
    CompileValidationReport,
    StylometricAuditReport,
    OfflineParityReport,
} from './fce/compile.bit'

export class CompileModel implements Compile {
    idx: string = '43.compile'
    status:
        | 'IDLE'
        | 'PASS_1_INGRESS'
        | 'PASS_2_TOPOLOGY'
        | 'PASS_3_SEALING'
        | 'GATE_0_VERIFICATION'
        | 'SEALED'
        | 'FAILED' = 'IDLE'
    activeSeries: string = '000.sample-hearth'
    lastMerkleHash: string = ''
    lastCompiledTimestamp: string = ''
    compileCount: number = 0
    entityCatalog: Record<string, any> = {}
    entityHashes: Record<string, string> = {}
    diagnostics: string[] = []
    lastReport?: CompileValidationReport
    lastStylometricReport?: StylometricAuditReport
    lastOfflineParity?: OfflineParityReport
}
