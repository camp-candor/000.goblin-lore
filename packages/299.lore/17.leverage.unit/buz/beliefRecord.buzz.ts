import { LeverageModel } from '../leverage.model'
import BeliefRecordBit from '../fce/beliefRecord.bit'
import State from '../../99.core/state'
import {
    BeliefRecordSchema,
    BeliefRecord,
    EvaluateBeliefDivergenceInputSchema,
    EvaluateBeliefDivergenceInput,
} from '../val/beliefRecord.val'
import {
    BeliefDivergenceReceiptBit,
    EpistemicAlignment,
} from '../fce/beliefRecord.interface'

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

/**
 * Attenuates confidence across network transmission hops: C_(n+1) = floor(C_n * 8000 / 10000).
 */
export function propagateRumorBelief(
    sourceBelief: BeliefRecord,
    transmittingAgentId: string,
    newHolderId: string,
    newBeliefId: string,
): BeliefRecord {
    const degradedConfidence = Math.floor(
        (sourceBelief.subjective_confidence_bps * 8000) / 10000,
    )

    return BeliefRecordSchema.parse({
        ...sourceBelief,
        belief_id: newBeliefId,
        holder_id: newHolderId,
        source_type: 'RUMOR',
        source_agent_id: transmittingAgentId,
        parent_belief_id: sourceBelief.belief_id,
        hop_count: sourceBelief.hop_count + 1,
        subjective_confidence_bps: degradedConfidence,
    })
}

/**
 * Non-boolean truth comparator evaluating subjective belief against multi-valued world reality.
 * Protects UNRESOLVED_BY_CANON propositions from false-classification.
 */
export function evaluateBeliefDivergence(
    input: EvaluateBeliefDivergenceInput,
): BeliefDivergenceReceiptBit {
    const parsed = EvaluateBeliefDivergenceInputSchema.parse(input)
    const { belief, canonical_standing, canonical_truth_value } = parsed

    const believesTrue = belief.subjective_confidence_bps >= 5000

    // RULE 1: Mysteries flagged UNRESOLVED_BY_CANON cannot be true or false
    if (canonical_standing === 'UNRESOLVED_BY_CANON') {
        return {
            valid: true,
            belief_id: belief.belief_id,
            holder_id: belief.holder_id,
            proposition_slug: belief.proposition_slug,
            subjective_confidence_bps: belief.subjective_confidence_bps,
            canonical_standing,
            alignment: 'UNRESOLVED_CANON_IMMUNITY',
            creates_dramatic_irony: false,
            detail: 'Proposition is unresolved by canon; belief is protected from binary truth evaluation.',
        }
    }

    // RULE 2: Contested historical events with DISPUTED standing
    if (canonical_standing === 'DISPUTED') {
        return {
            valid: true,
            belief_id: belief.belief_id,
            holder_id: belief.holder_id,
            proposition_slug: belief.proposition_slug,
            subjective_confidence_bps: belief.subjective_confidence_bps,
            canonical_standing,
            alignment: 'DISPUTED_UNCERTAINTY',
            creates_dramatic_irony: true,
            detail: 'World reality is canonically disputed; character holds subjective stance on contested history.',
        }
    }

    // RULE 3: Definite truth evaluation against KNOWN_TRUE / KNOWN_FALSE
    let alignment: EpistemicAlignment
    let createsDramaticIrony = false

    if (canonical_standing === 'KNOWN_TRUE') {
        if (believesTrue) {
            alignment = 'ALIGNED_TRUE'
        } else {
            alignment = 'FALSE_DISBELIEF'
            createsDramaticIrony = true
        }
    } else {
        // KNOWN_FALSE
        if (believesTrue) {
            alignment = 'FALSE_BELIEF'
            createsDramaticIrony = true
        } else {
            alignment = 'ALIGNED_FALSE'
        }
    }

    return {
        valid: true,
        belief_id: belief.belief_id,
        holder_id: belief.holder_id,
        proposition_slug: belief.proposition_slug,
        subjective_confidence_bps: belief.subjective_confidence_bps,
        canonical_standing,
        alignment,
        creates_dramatic_irony: createsDramaticIrony,
        detail: createsDramaticIrony
            ? `Dramatic Irony: Holder believes proposition is ${believesTrue ? 'TRUE' : 'FALSE'}, but world standing is ${canonical_standing}.`
            : `Epistemic Concordance: Belief aligns with world standing ${canonical_standing}.`,
    }
}

export const evaluateBeliefDivergenceBuzz = async (
    cpy: LeverageModel,
    bal: BeliefRecordBit<any>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ belBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const receipt = evaluateBeliefDivergence(bal.dat)

    if (receipt.creates_dramatic_irony) {
        await emitTelemetry(
            'cns00',
            `>> [BELIEF:DRAMATIC_IRONY] Actor ${receipt.holder_id}: ${receipt.alignment} on ${receipt.proposition_slug} (${receipt.subjective_confidence_bps} bps)`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [BELIEF:EVAL_OK] Actor ${receipt.holder_id}: ${receipt.alignment} [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            belBit: {
                idx: bal.idx,
                val: 1,
                dat: receipt as unknown as BeliefRecord,
            },
        })
    }
    return cpy
}
