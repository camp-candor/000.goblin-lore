import * as path from 'node:path'
import { emitBusConsoleLog } from '../../99.bus.unit/buz/bus.buzz.js'

export const streamGenesisSealStart = async (
    seriesSlug: string,
): Promise<void> => {
    await emitBusConsoleLog(
        'cns00',
        '>> [LORE::COMPILER] Starting 3-Pass Deterministic Compilation...',
    )
    await emitBusConsoleLog(
        'cns00',
        `>> [LORE::COMPILER] Target series: '${seriesSlug}'`,
    )
}

export const streamPassOneReceipt = async (
    entityCount: number,
): Promise<void> => {
    await emitBusConsoleLog(
        'cns00',
        `>> [OK] Pass 1: ${entityCount} Byte-0 Seed Dossiers verified.`,
    )
}

export const streamPassTwoReceipt = async (): Promise<void> => {
    await emitBusConsoleLog(
        'cns00',
        '>> [LORE::DAG] [OK] Referential Integrity Verified: 0 Dangling Pointers.',
    )
    await emitBusConsoleLog(
        'cns00',
        '>> [LORE::DAG] [OK] Grievance DAG Acyclicity Verified: 0 Circular Loops.',
    )
}

export const streamPassThreeReceipt = async (
    merkleRoot: string,
    headPath: string,
    wormPath: string,
): Promise<void> => {
    await emitBusConsoleLog(
        'cns00',
        `>> [GENESIS_SEALED] H_root: ${merkleRoot}`,
    )
    await emitBusConsoleLog('cns00', `>> [OK] Canonical HEAD: ${headPath}`)
    await emitBusConsoleLog(
        'cns00',
        `>> [OK] WORM Archive : ${path.basename(wormPath)}`,
    )
}

export const streamCompilationFailure = async (
    passName: string,
    errorMsg: string,
): Promise<void> => {
    await emitBusConsoleLog('cns00', `>> [FAIL] [${passName}] ${errorMsg}`)
}
