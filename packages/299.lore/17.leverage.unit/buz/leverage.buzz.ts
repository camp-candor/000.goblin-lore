import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { LeverageModel } from '../leverage.model'
import LeverageBit from '../fce/leverage.bit'
import State from '../../99.core/state'
import {
    CharacterLeverageVectorSchema,
    CharacterLeverageVector,
    StringsLedgerRecordSchema,
    StringsLedgerRecord,
    makeRelationId,
    SpendLeverageInputSchema,
    SpendLeverageInput,
    DirectoryIndexInputSchema,
    DirectoryIndexInput,
} from '../val/leverage.val'
import {
    LeverageDirectoryIndexResultBit,
    LeverageVerificationErrorBit,
    SpendLeverageResultBit,
} from '../fce/leverage.interface'

/**
 * 7-bit ASCII Telemetry logger helper for cns00 console widget.
 */
async function emitTelemetry(channel: string, message: string): Promise<void> {
    const lib = (
        globalThis as unknown as {
            LIBRARY?: { hunt: (typ: string, obj: unknown) => Promise<void> }
        }
    ).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        await lib.hunt('[Console action] Update Console', {
            idx: channel,
            src: message,
        })
    }
}

export const initLeverage = (
    cpy: LeverageModel,
    bal: LeverageBit,
    ste: State,
) => {
    cpy.records = {}
    cpy.character_vectors = {}
    cpy.errors = []
    if (bal.slv) {
        bal.slv({ levBit: { idx: 'init-leverage', val: 1 } })
    }
    return cpy
}

export const updateLeverage = (
    cpy: LeverageModel,
    bal: LeverageBit,
    ste: State,
) => {
    if (bal.slv) {
        bal.slv({ levBit: { idx: 'update-leverage', val: 1 } })
    }
    return cpy
}

/**
 * Synchronously scans series/<slug>/characters/*.md on local disk and indexes directional debt.
 */
export function indexCharacterLeverageDirectory(
    input: DirectoryIndexInput,
): LeverageDirectoryIndexResultBit {
    const parsed = DirectoryIndexInputSchema.safeParse(input)
    if (!parsed.success) {
        return {
            success: false,
            total_characters_scanned: 0,
            total_directed_edges: 0,
            records: [],
            errors: [
                {
                    holder_id: 'unknown',
                    target_id: 'unknown',
                    errorCode: 'DANGLING_LEVERAGE_TARGET',
                    reason:
                        parsed.error.issues[0]?.message ??
                        'Invalid directory index input',
                },
            ],
        }
    }

    const { series_root_path, series_slug } = parsed.data
    const charsDir = path.join(
        series_root_path,
        'series',
        series_slug,
        'characters',
    )

    if (!fs.existsSync(charsDir)) {
        return {
            success: true,
            total_characters_scanned: 0,
            total_directed_edges: 0,
            records: [],
            errors: [],
        }
    }

    const fileNames = fs
        .readdirSync(charsDir)
        .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    const activeCharIds = new Set<string>()
    const parsedVectors: CharacterLeverageVector[] = []

    // Pass 1: Collect valid character IDs
    for (const fileName of fileNames) {
        const fullPath = path.join(charsDir, fileName)
        const content = fs.readFileSync(fullPath, 'utf8')
        const parsedFile = matter(content)
        if (parsedFile.data?.id && typeof parsedFile.data.id === 'string') {
            activeCharIds.add(parsedFile.data.id)
            const vectorCandidate = {
                actor_id: parsedFile.data.id,
                strings_held_over:
                    parsedFile.data?.epistemic?.strings_held_over ?? [],
                leverage_strings:
                    parsedFile.data?.epistemic?.leverage_strings ?? {},
            }
            const validatedVector =
                CharacterLeverageVectorSchema.safeParse(vectorCandidate)
            if (validatedVector.success) {
                parsedVectors.push(validatedVector.data)
            }
        }
    }

    const errors: LeverageVerificationErrorBit[] = []
    const recordsMap = new Map<string, StringsLedgerRecord>()

    // Pass 2: Verify foreign-key target presence, anti-reflexivity, and build directed edges
    for (const vector of parsedVectors) {
        const holderId = vector.actor_id

        // A. Parse strings_held_over array
        for (const debtorId of vector.strings_held_over) {
            if (holderId === debtorId) {
                errors.push({
                    holder_id: holderId,
                    target_id: debtorId,
                    errorCode: 'ANTI_REFLEXIVITY_BREACH',
                    reason: `Character ${holderId} declared a leverage string held over themselves in strings_held_over`,
                })
                continue
            }

            if (!activeCharIds.has(debtorId)) {
                errors.push({
                    holder_id: holderId,
                    target_id: debtorId,
                    errorCode: 'DANGLING_LEVERAGE_TARGET',
                    reason: `Character ${holderId} points to non-existent debtor ${debtorId} in strings_held_over`,
                })
                continue
            }

            const relId = makeRelationId(holderId, debtorId)
            const count = vector.leverage_strings[debtorId] ?? 1

            const record: StringsLedgerRecord = {
                relation_id: relId,
                holder_id: holderId,
                debtor_id: debtorId,
                weight_bps: 10000,
                strings_count: count,
                updated_at_epoch: 0,
            }

            recordsMap.set(relId, StringsLedgerRecordSchema.parse(record))
        }

        // B. Parse explicit leverage_strings counts
        for (const [debtorId, count] of Object.entries(
            vector.leverage_strings,
        )) {
            if (holderId === debtorId) {
                errors.push({
                    holder_id: holderId,
                    target_id: debtorId,
                    errorCode: 'ANTI_REFLEXIVITY_BREACH',
                    reason: `Character ${holderId} declared explicit leverage weight over themselves`,
                })
                continue
            }

            if (!activeCharIds.has(debtorId)) {
                errors.push({
                    holder_id: holderId,
                    target_id: debtorId,
                    errorCode: 'DANGLING_LEVERAGE_TARGET',
                    reason: `Character ${holderId} references unregistered target ${debtorId} in leverage_strings`,
                })
                continue
            }

            const relId = makeRelationId(holderId, debtorId)
            const existing = recordsMap.get(relId)
            const finalCount = count

            const record: StringsLedgerRecord = {
                relation_id: relId,
                holder_id: holderId,
                debtor_id: debtorId,
                weight_bps: 10000,
                strings_count: finalCount,
                updated_at_epoch: existing?.updated_at_epoch ?? 0,
            }

            recordsMap.set(relId, StringsLedgerRecordSchema.parse(record))
        }
    }

    const success = errors.length === 0
    const records = Array.from(recordsMap.values())

    return {
        success,
        total_characters_scanned: activeCharIds.size,
        total_directed_edges: records.length,
        records,
        errors,
    }
}

export const indexLeverageDirectoryBuzz = async (
    cpy: LeverageModel,
    bal: LeverageBit<DirectoryIndexInput>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ levBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const result = indexCharacterLeverageDirectory(bal.dat)
    cpy.errors = [...result.errors]

    for (const record of result.records) {
        cpy.records[record.relation_id] = record
    }

    if (!result.success) {
        await emitTelemetry(
            'cns00',
            `:: [LEVERAGE:INDEX_FAIL] Scanned ${result.total_characters_scanned} characters. Encountered ${result.errors.length} relational breach(es)!`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [LEVERAGE:INDEX_PASS] Indexed ${result.total_directed_edges} directed debt edge(s) across ${result.total_characters_scanned} characters [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            levBit: {
                idx: bal.idx,
                val: result.success ? 1 : 0,
                dat: result as any,
            },
        })
    }
    return cpy
}

/**
 * Spends held leverage strings between two characters.
 * Enforces anti-reflexivity, solvency, and integer basis points.
 */
export function spendLeverageStrings(
    records: Record<string, StringsLedgerRecord>,
    input: SpendLeverageInput,
): SpendLeverageResultBit {
    const parsed = SpendLeverageInputSchema.safeParse(input)
    if (!parsed.success) {
        return {
            success: false,
            relation_id: makeRelationId(
                input?.holder_id ?? 'unknown',
                input?.debtor_id ?? 'unknown',
            ),
            remaining_strings_count: 0,
            errorCode: 'ANTI_REFLEXIVITY_BREACH',
            reason:
                parsed.error.issues[0]?.message ??
                'Invalid spend input payload',
        }
    }

    const { holder_id, debtor_id, spend_count } = parsed.data
    const relId = makeRelationId(holder_id, debtor_id)
    const currentRecord = records[relId]

    if (!currentRecord || currentRecord.strings_count < spend_count) {
        const available = currentRecord?.strings_count ?? 0
        return {
            success: false,
            relation_id: relId,
            remaining_strings_count: available,
            errorCode: 'INSUFFICIENT_STRINGS_BREACH',
            reason: `Entity ${holder_id} attempted to spend ${spend_count} strings over ${debtor_id}, but only holds ${available}`,
        }
    }

    const remaining = currentRecord.strings_count - spend_count
    records[relId] = StringsLedgerRecordSchema.parse({
        ...currentRecord,
        strings_count: remaining,
    })

    return {
        success: true,
        relation_id: relId,
        remaining_strings_count: remaining,
    }
}

export const spendLeverageStringsBuzz = async (
    cpy: LeverageModel,
    bal: LeverageBit<SpendLeverageInput>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ levBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const result = spendLeverageStrings(cpy.records, bal.dat)

    if (!result.success) {
        await emitTelemetry(
            'cns00',
            `:: [LEVERAGE:SPEND_FAIL] ${result.relation_id}: ${result.errorCode} -> ${result.reason}`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [LEVERAGE:SPEND_PASS] ${result.relation_id}: Deducted ${bal.dat.spend_count} string(s). Balance: ${result.remaining_strings_count} [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            levBit: {
                idx: bal.idx,
                val: result.success ? 1 : 0,
                dat: result as unknown as StringsLedgerRecord,
            },
        })
    }
    return cpy
}

export const verifyLeverageIntegrityBuzz = async (
    cpy: LeverageModel,
    bal: LeverageBit,
    ste: State,
) => {
    const hasErrors = cpy.errors.length > 0
    if (hasErrors) {
        await emitTelemetry(
            'cns00',
            `:: [LEVERAGE:AUDIT_FAIL] ${cpy.errors.length} unresolved leverage errors in local model`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [LEVERAGE:AUDIT_PASS] All ${Object.keys(cpy.records).length} directional debt strings conform to Pass 2 relational laws [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({ levBit: { idx: bal.idx, val: hasErrors ? 0 : 1 } })
    }
    return cpy
}
