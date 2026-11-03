import type { LedgerModel } from './ledger.model.js'
import type LedgerBit from './fce/ledger.bit.js'
import type State from '../99.core/state.js'
import {
    loadConditionsCatalogFromDisk,
    extractCharacterSomaticRecord,
} from './buz/extractSomaticLedger.buzz.js'
import { SqliteSomaticStore } from './buz/sqliteSomaticStore.buzz.js'

const UPDATE_CONSOLE = '[Console action] Update Console'

const emitLedgerConsole = async (
    ste: State | undefined,
    src: string,
): Promise<void> => {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        try {
            await Promise.race([
                lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src }),
                Promise.resolve(),
            ])
        } catch {
            // Ignore in headless/mock environments
        }
    }
    if (ste && ste !== lib && typeof ste.hunt === 'function') {
        try {
            await Promise.race([
                ste.hunt(UPDATE_CONSOLE, { idx: 'cns00', src }),
                Promise.resolve(),
            ])
        } catch {
            // Ignore in headless/mock environments
        }
    }
}

export const initLedger = (
    cpy: LedgerModel,
    bal: LedgerBit,
    ste: State,
): LedgerModel => {
    cpy.conditionsCatalog = {}
    cpy.somaticRecords = {}
    if (!cpy.sqliteStore) {
        cpy.sqliteStore = new SqliteSomaticStore(':memory:')
    }
    if (bal?.slv) {
        bal.slv({ ldgBit: { idx: 'init-ledger-ok', val: 1 } })
    }
    return cpy
}

export const updateLedger = (
    cpy: LedgerModel,
    bal: LedgerBit,
    ste: State,
): LedgerModel => {
    if (bal?.slv) {
        bal.slv({ ldgBit: { idx: 'update-ledger-ok', val: 1 } })
    }
    return cpy
}

export const extractSomaticLedger = async (
    cpy: LedgerModel,
    bal: LedgerBit<{ conditionsPath: string; characterPaths: string[] }>,
    ste: State,
): Promise<LedgerModel> => {
    const payload = bal.dat
    if (!payload || !payload.conditionsPath || !payload.characterPaths) {
        if (bal.slv) {
            bal.slv({ ldgBit: { idx: 'extract-somatic-ledger-fail', val: -1 } })
        }
        return cpy
    }

    if (!cpy.sqliteStore) {
        cpy.sqliteStore = new SqliteSomaticStore(':memory:')
    }

    try {
        const catalogMap = loadConditionsCatalogFromDisk(payload.conditionsPath)
        cpy.conditionsCatalog = Object.fromEntries(catalogMap)

        const extracted: Record<string, any> = {}
        for (const charPath of payload.characterPaths) {
            const record = extractCharacterSomaticRecord(charPath, catalogMap)
            extracted[record.entityId] = record
            cpy.somaticRecords[record.entityId] = record
            cpy.sqliteStore.upsertSomaticLedgerRecord(record)

            const displayPath = record.sourceDossierPath.replace(
                /\/characters\/char_([a-z0-9_]+\.md)$/i,
                '/characters/$1',
            )
            await emitLedgerConsole(
                ste,
                `>> [SOMATIC_LEDGER] Parsing Byte-0 dossier: ${displayPath}`,
            )
            await emitLedgerConsole(
                ste,
                `>> [SOMATIC_LEDGER] Verified SHA-256: ${record.contentSha256.slice(0, 5)}... [OK]`,
            )
            for (const condSlug of record.activeConditions) {
                const cond = catalogMap.get(condSlug)
                if (!cond) continue
                if (cond.arm_penalty_bps > 0) {
                    await emitLedgerConsole(
                        ste,
                        `>> [TRAUMA] Ingested Condition: ${condSlug} (Arm Penalty: ${cond.arm_penalty_bps.toLocaleString('en-US')} bps)`,
                    )
                } else {
                    await emitLedgerConsole(
                        ste,
                        `>> [TRAUMA] Ingested Condition: ${condSlug} (Pain Floor: ${cond.chronic_pain_floor_bps.toLocaleString('en-US')} bps | Formant Warping: ${cond.dsp_deltas.formant_warping_bps.toLocaleString('en-US')} bps)`,
                    )
                }
            }
            await emitLedgerConsole(
                ste,
                `>> [SQLITE] Materialized entities_somatic_live record for ${record.entityId} [OK]`,
            )
        }

        await emitLedgerConsole(
            ste,
            `>> [SOMATIC_LEDGER] Extracted ${payload.characterPaths.length} character dossiers from disk [OK]`,
        )

        const liveLedger = (ste as any)?.value?.ledger as
            LedgerModel | undefined
        if (liveLedger && liveLedger !== cpy) {
            liveLedger.conditionsCatalog = {
                ...liveLedger.conditionsCatalog,
                ...cpy.conditionsCatalog,
            }
            liveLedger.somaticRecords = {
                ...liveLedger.somaticRecords,
                ...cpy.somaticRecords,
            }
            liveLedger.sqliteStore = cpy.sqliteStore
        }

        if (bal.slv) {
            bal.slv({
                ldgBit: {
                    idx: 'extract-somatic-ledger-ok',
                    val: Object.keys(extracted).length,
                    dat: Object.values(extracted),
                },
            })
        }
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err)
        if (ste) {
            await ste.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: [SOMATIC_LEDGER FAIL] ${message}`,
            })
        }
        if (bal.slv) {
            bal.slv({
                ldgBit: {
                    idx: 'extract-somatic-ledger-err',
                    val: -1,
                    src: message,
                },
            })
        }
    }

    return cpy
}

export const querySomaticLedgerRecord = (
    cpy: LedgerModel,
    bal: LedgerBit<{ entityId: string }>,
    ste: State,
): LedgerModel => {
    const entityId = bal.dat?.entityId
    if (!entityId || !cpy.sqliteStore) {
        if (bal.slv) bal.slv({ ldgBit: { idx: 'query-ledger-fail', val: 0 } })
        return cpy
    }

    const record = cpy.sqliteStore.queryCharacterSomaticLedger(entityId)
    if (bal.slv) {
        bal.slv({
            ldgBit: {
                idx: record ? 'query-ledger-ok' : 'query-ledger-not-found',
                val: record ? 1 : 0,
                dat: record || undefined,
            },
        })
    }
    return cpy
}
