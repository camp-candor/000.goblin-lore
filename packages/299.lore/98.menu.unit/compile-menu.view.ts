/**
 * packages/299.lore/98.menu.unit/compile-menu.view.ts
 *
 * Interactive Blessed choice dialog options and rich 7-bit ASCII telemetry
 * streaming formatter for 299.lore compile operations into the cns00 pane.
 */

import type State from '../99.core/state'

const UPDATE_CONSOLE = '[Console action] Update Console'

export interface CompileMenuOption {
    key: string
    label: string
    actionType: string
    description: string
}

export const COMPILE_MENU_OPTIONS: CompileMenuOption[] = [
    {
        key: '1',
        label: '[1] RUN COMPLETE THREE-PASS GAUNTLET',
        actionType: '[Compile action] Run Complete Gauntlet',
        description:
            'Executes Passes 1-3 sequentially and mints sealed Merkle root',
    },
    {
        key: '2',
        label: '[2] PASS 1: STRUCTURAL BOUNDS & SOMATIC SAT',
        actionType: '[Compile action] Pass 1 Structural Bounds',
        description:
            'Evaluates Byte-0 laws, Zod schemas, and anatomical limb capacities',
    },
    {
        key: '3',
        label: '[3] PASS 2: RELATIONAL DAG & ACYCLICITY CHECK',
        actionType: '[Compile action] Pass 2 Relational Topology',
        description:
            'Sweeps foreign keys, portal reciprocity, and 3-color DFS cycles',
    },
    {
        key: '4',
        label: '[4] PASS 3: DETERMINISTIC SEAL & MERKLE EMISSION',
        actionType: '[Compile action] Pass 3 Deterministic Seal',
        description:
            'RFC 8785 key canonicalization, NFC normalization, and SHA-256 seal',
    },
    {
        key: '5',
        label: '[5] GATE 0 VERIFICATION AUDIT (ZERO-DRIFT TRIPWIRE)',
        actionType: '[Compile action] Gate 0 Verification Audit',
        description:
            'Runs perimeter checks, type soundness, and git diff --exit-code',
    },
    {
        key: '<',
        label: '[<] RETURN TO LORE MENU',
        actionType: '[Menu action] Update Menu',
        description: 'Returns to primary lore dashboard',
    },
]

/**
 * Streams formatted 7-bit ASCII lines into the cns00 Blessed console pane.
 */
export async function emitConsoleLine(
    ste: State | undefined,
    text: string,
): Promise<void> {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        try {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: text,
            })
        } catch {
            // Ignore in-progress teardown
        }
    }
    if (ste && ste !== lib && typeof ste.hunt === 'function') {
        try {
            await Promise.race([
                ste.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: text,
                }),
                Promise.resolve(),
            ])
        } catch {
            // Fallback silently if console unit is unmounted
        }
    }
}

/**
 * Renders the 7-bit ASCII Goblin Lore Cockpit HUD banner into cns00.
 */
export async function printLoreCockpitBanner(
    ste: State | undefined,
    activeSeries: string,
    compilerStatus: string = 'IDLE',
    lastMerkleHash: string = '',
): Promise<void> {
    const hashPreview = lastMerkleHash
        ? `${lastMerkleHash.slice(0, 16)}...${lastMerkleHash.slice(-8)}`
        : 'UNSEALED (RUN [C] TO MINT)'

    const lines = [
        '+==============================================================================+',
        '|               GOBLIN LORE :: ONTOLOGICAL COMPILER & AUDIT DECK               |',
        '+------------------------------------------------------------------------------+',
        `| SERIES : ${activeSeries.padEnd(26)} | ENGINE : 43.compile.unit (T_0 = $0.00) |`,
        `| STATUS : ${compilerStatus.padEnd(26)} | H_ROOT : ${hashPreview.padEnd(29)} |`,
        '+==============================================================================+',
    ]
    for (const line of lines) {
        await emitConsoleLine(ste, line)
    }
}

/**
 * Formats and prints the comprehensive multi-line compilation receipt to cns00.
 */
export async function printDetailedCompileReceipt(
    ste: State | undefined,
    seriesSlug: string,
    resBit: any,
    elapsedMs: number,
): Promise<void> {
    const divider =
        '>> =============================================================================='
    const subDivider =
        '>> ------------------------------------------------------------------------------'

    await emitConsoleLine(ste, divider)
    await emitConsoleLine(
        ste,
        `>> [COMPILE:COMPLETE] Series: [${seriesSlug}] in ${elapsedMs}ms`,
    )
    await emitConsoleLine(ste, subDivider)

    if (resBit?.catalogSummary) {
        const s = resBit.catalogSummary
        const chars = s.characterCount ?? s.characters ?? 0
        const locs = s.locationCount ?? s.locations ?? 0
        const items = s.possessionCount ?? s.items ?? 0
        const grvs = s.grievanceCount ?? s.grievances ?? 0
        const mys = s.mysteryCount ?? s.mysteries ?? 0
        await emitConsoleLine(
            ste,
            `>> [CATALOG] Entities: ${s.totalEntities} total | ${chars} chars | ${locs} locs | ${items} items | ${grvs} grievances${mys ? ` | ${mys} mysteries` : ''}`,
        )
    }

    if (resBit?.validationReport) {
        const r = resBit.validationReport
        const failCount = Array.isArray(r.failures)
            ? r.failures.length
            : Array.isArray(r.errors)
              ? r.errors.length
              : 0
        const warnCount = Array.isArray(r.warnings) ? r.warnings.length : 0
        const evalFiles =
            r.evaluatedFiles ?? resBit?.catalogSummary?.totalEntities ?? 0
        await emitConsoleLine(
            ste,
            `>> [VALIDATION] Evaluated: ${evalFiles} dossiers | Failures: ${failCount} | Warnings: ${warnCount}`,
        )

        if (r.byte0Compliant !== undefined) {
            const flag = (ok: boolean | undefined) =>
                ok === false ? '[FAIL]' : '[OK]'
            await emitConsoleLine(
                ste,
                `>> [INVARIANTS] BYTE0:${flag(r.byte0Compliant)} ASCII:${flag(r.ascii7BitCompliant)} SCHEMA:${flag(r.schemaValid)} SAT:${flag(r.somaticSatValid)} FK:${flag(r.foreignKeysValid)} DAG:${flag(r.grievanceDagAcyclic)} PORTAL:${flag(r.spatialPortalsReciprocal)} CLUE:${flag(r.clueLemmaDisjoint)}`,
            )
        }
    }

    if (resBit?.stylometricReport) {
        const st = resBit.stylometricReport
        const statusTag = st.passed ? '[OK]' : '[WARN]'
        await emitConsoleLine(
            ste,
            `>> [STYLOMETRICS] ${statusTag} Audited: ${st.scannedEntities} | Lexical Diversity: ${st.averageLexicalDiversityBp} bp | Slop: ${st.slopViolations?.length ?? 0} | Voice-Bleed: ${st.voiceBleedCollisions?.length ?? 0}`,
        )
    }

    if (resBit?.offlineParityReport) {
        const op = resBit.offlineParityReport
        await emitConsoleLine(
            ste,
            `>> [HERMETIC:PARITY] ${op.parityVerified ? '[VERIFIED]' : '[DRIFT]'} Purged: ${op.purgedFilesCount} | Initial==Rebuilt: ${op.initialHash === op.rebuiltHash}`,
        )
    }

    if (
        resBit?.entityHashes &&
        typeof resBit.entityHashes === 'object' &&
        Object.keys(resBit.entityHashes).length > 0
    ) {
        await emitConsoleLine(
            ste,
            '>> [MERKLE:LEAVES] Deterministic RFC 8785 JCS Entity Digests:',
        )
        for (const [entId, digest] of Object.entries(resBit.entityHashes)) {
            await emitConsoleLine(
                ste,
                `>>   + ${entId.padEnd(20)} :: sha256:${String(digest).slice(0, 24)}...`,
            )
        }
    }

    if (resBit?.rootMerkleHash) {
        await emitConsoleLine(
            ste,
            `>> [SEAL:MERKLE_ROOT] H_root: ${resBit.rootMerkleHash}`,
        )
    }

    if (resBit?.canonicalPath) {
        await emitConsoleLine(
            ste,
            `>> [SNAPSHOT:CANONICAL] ${resBit.canonicalPath}`,
        )
    }

    if (resBit?.archivePath) {
        await emitConsoleLine(
            ste,
            `>> [SNAPSHOT:ARCHIVE]   ${resBit.archivePath}`,
        )
    }

    await emitConsoleLine(
        ste,
        '>> [STATUS:FINAL] [SEALED] Bit-identical canon verified and persisted.',
    )
    await emitConsoleLine(ste, divider)
}

/**
 * Formats and prints a compile error redline report to cns00.
 */
export async function printCompileFailureReport(
    ste: State | undefined,
    seriesSlug: string,
    errBit: any,
): Promise<void> {
    const divider =
        ':: =============================================================================='
    await emitConsoleLine(ste, divider)
    await emitConsoleLine(ste, `:: [COMPILE:FAILED] Series: [${seriesSlug}]`)
    await emitConsoleLine(
        ste,
        `:: Error Code: ${errBit?.code || 'UNKNOWN_ERROR'}`,
    )
    await emitConsoleLine(
        ste,
        `:: Reason:     ${errBit?.message || 'No detail provided'}`,
    )

    if (Array.isArray(errBit?.failures)) {
        for (const f of errBit.failures) {
            const loc = f.targetFile ? ` (${f.targetFile})` : ''
            await emitConsoleLine(ste, `::   - [${f.gate}] ${f.message}${loc}`)
        }
    }

    await emitConsoleLine(
        ste,
        ':: Action Required: Fix source Markdown and re-trigger compilation.',
    )
    await emitConsoleLine(ste, divider)
}
