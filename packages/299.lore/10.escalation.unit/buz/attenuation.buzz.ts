import { EscalationModel } from '../escalation.model'
import AttenuationBit from '../fce/attenuation.bit'
import State from '../../99.core/state'
import {
    AttenuationDirectiveSchema,
    AttenuationDirective,
    DialogueScanInputSchema,
    DialogueScanInput,
} from '../val/attenuation.val'
import {
    AttenuationScanResultBit,
    AttenuationViolationBit,
} from '../fce/attenuation.interface'

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
 * Scans candidate dialogue text against an AttenuationDirective using boundary-safe regexes.
 * Halts at T_0 = $0.00 upon encountering forbidden Underneath lemmas.
 */
export function auditDialogueAttenuation(
    input: DialogueScanInput,
): AttenuationScanResultBit {
    const parsed = DialogueScanInputSchema.safeParse(input)
    if (!parsed.success) {
        return {
            passed: false,
            actor_id: input?.actor_id ?? 'char_unknown',
            suppression_factor_bps:
                input?.directive?.suppression_factor_bps ?? 0,
            violations: [],
            tactical_proxies: [],
            errorCode: 'SCHEMA_VALIDATION_ERROR',
            reason:
                parsed.error.issues[0]?.message ??
                'Invalid attenuation scan payload',
        }
    }

    const { actor_id, dialogue_text, directive, is_break_state_authorized } =
        parsed.data

    // If suppression is below 7,000 bps (0.70) or character has an earned break state, pass without checking
    if (directive.suppression_factor_bps < 7000 || is_break_state_authorized) {
        return {
            passed: true,
            actor_id,
            suppression_factor_bps: directive.suppression_factor_bps,
            violations: [],
            tactical_proxies: directive.tactical_proxies,
            errorCode: 'NONE',
        }
    }

    const violations: AttenuationViolationBit[] = []

    for (const token of directive.banned_tokens) {
        const escapedToken = token.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
        const regex = new RegExp(`\\b${escapedToken}\\b`, 'i')
        const match = regex.exec(dialogue_text)

        if (match) {
            violations.push({
                leaked_lemma: token,
                match_index: match.index,
                matched_span: match[0],
            })
        }
    }

    const passed = violations.length === 0

    return {
        passed,
        actor_id,
        suppression_factor_bps: directive.suppression_factor_bps,
        violations,
        tactical_proxies: directive.tactical_proxies,
        errorCode: passed ? 'NONE' : 'ATTENUATION_MASK_VIOLATION',
        reason: passed
            ? undefined
            : `ATTENUATION_MASK_VIOLATION: Dialogue leaked forbidden lemma(s) [${violations.map((v) => v.leaked_lemma).join(', ')}] while Subtext Suppression is >= 7000 bps`,
    }
}

export const auditDialogueAttenuationBuzz = async (
    cpy: EscalationModel,
    bal: AttenuationBit<DialogueScanInput>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ attBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const result = auditDialogueAttenuation(bal.dat)

    if (!result.passed) {
        await emitTelemetry(
            'cns00',
            `:: [ATTENUATION_MASK_VIOLATION] Actor ${result.actor_id}: Banned lemma(s) [${result.violations.map((v) => v.leaked_lemma).join(', ')}] detected at T0 = $0.00`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [ATTENUATION:ENGAGED_OK] Actor ${result.actor_id}: Verified subtext displacement (S=${result.suppression_factor_bps} bps) [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            attBit: {
                idx: bal.idx,
                val: result.passed ? 1 : 0,
                dat: result as unknown as AttenuationDirective,
            },
        })
    }
    return cpy
}
