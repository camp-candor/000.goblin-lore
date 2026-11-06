import {
    StalenessEvaluationInputSchema,
    StalenessEvaluationReceiptSchema,
    assertIntegerMetric,
    type StalenessEvaluationInput,
    type StalenessEvaluationReceipt,
    type FactDiffItem,
} from '../val/factPinning.val.js'

export function evaluateSceneSomaticStaleness(
    input: StalenessEvaluationInput,
    epoch: number = 0,
): StalenessEvaluationReceipt {
    const parsed = StalenessEvaluationInputSchema.parse(input)
    assertIntegerMetric(epoch, 'epoch')

    const diffs: FactDiffItem[] = []

    for (const pinned of parsed.pinnedFacts) {
        assertIntegerMetric(
            pinned.pinnedVersion,
            `pinnedVersion for ${pinned.factId}`,
        )
        const live = parsed.liveLedgerFacts[pinned.factId]

        if (!live) {
            // Pinned fact does not exist in live ledger -> critical orphan breach
            diffs.push({
                factId: pinned.factId,
                pinnedVersion: pinned.pinnedVersion,
                liveVersion: 0,
                pinnedClaimText: pinned.claimText,
                liveClaimText: 'NOT_FOUND_IN_LIVE_LEDGER',
                invalidationReason: `Fact [${pinned.factId}] was purged or missing from live ledger`,
                isRetired: true,
            })
            continue
        }

        assertIntegerMetric(
            live.currentVersion,
            `currentVersion for ${live.factId}`,
        )

        // Monotonic guard: Check if live version exceeds pinned version or fact is retired
        if (live.currentVersion > pinned.pinnedVersion || live.isRetired) {
            const reason = live.isRetired
                ? `Fact [${pinned.factId}] retired (v${pinned.pinnedVersion} -> v${live.currentVersion})`
                : `Upstream fact mutated: ${pinned.factId} (v${pinned.pinnedVersion} -> v${live.currentVersion}) | Old: [${pinned.claimText}] -> New: [${live.claimText}]`

            diffs.push({
                factId: pinned.factId,
                pinnedVersion: pinned.pinnedVersion,
                liveVersion: live.currentVersion,
                pinnedClaimText: pinned.claimText,
                liveClaimText: live.claimText,
                invalidationReason: reason,
                isRetired: live.isRetired,
            })
        } else if (live.currentVersion < pinned.pinnedVersion) {
            // Retrograde version anomaly
            throw new Error(
                `MONOTONIC_VERSION_REGRESSION_BREACH: Pinned version (${pinned.pinnedVersion}) exceeds live ledger version (${live.currentVersion}) for ${pinned.factId}`,
            )
        }
    }

    const isDirty = diffs.length > 0
    const receipt: StalenessEvaluationReceipt = {
        sceneId: parsed.sceneId,
        isDirty,
        staleFactCount: diffs.length,
        diffs: Object.freeze(diffs),
        status: isDirty ? 'DIRTY_PENDING_REVALIDATION' : 'CLEAN',
        evaluatedAtEpoch: epoch,
    }

    const parsedReceipt = StalenessEvaluationReceiptSchema.parse(receipt)
    Object.freeze(parsedReceipt.diffs)
    return Object.freeze(parsedReceipt)
}

export function buildPinnedFactDictionary(
    entries: readonly {
        factId: string
        version: number
        hash: string
        claimText: string
    }[],
): Record<string, number> {
    const dict: Record<string, number> = {}
    for (const entry of entries) {
        assertIntegerMetric(entry.version, `version for ${entry.factId}`)
        dict[entry.factId] = entry.version
    }
    return Object.freeze(dict)
}
