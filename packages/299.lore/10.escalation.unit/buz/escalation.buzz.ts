import { EscalationModel } from '../escalation.model'
import EscalationBit from '../fce/escalation.bit'
import State from '../../99.core/state'
import {
    CharacterConversationalProfileSchema,
    CharacterConversationalProfile,
    DialogueTurnEvaluationInputSchema,
    DialogueTurnEvaluationInput,
    EscalationCeilingSchema,
    BaseStatsSchema,
} from '../val/escalation.val'
import {
    EscalationEvaluationResultBit,
    AttenuationLeakDiagnosticBit,
} from '../fce/escalation.interface'

/**
 * Pure 7-bit ASCII Telemetry logger helper.
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

export const initEscalation = (
    cpy: EscalationModel,
    bal: EscalationBit,
    ste: State,
) => {
    cpy.profiles = {}
    cpy.audit_history = []
    if (bal.slv) {
        bal.slv({ escBit: { idx: 'init-escalation', val: 1 } })
    }
    return cpy
}

export const updateEscalation = (
    cpy: EscalationModel,
    bal: EscalationBit,
    ste: State,
) => {
    if (bal.slv) {
        bal.slv({ escBit: { idx: 'update-escalation', val: 1 } })
    }
    return cpy
}

/**
 * Validates conversational escalation bounds on an actor profile.
 */
export function validateEscalationBounds(
    profile: CharacterConversationalProfile,
): { valid: boolean; errorCode?: string; reason?: string } {
    const ceilingParsed = EscalationCeilingSchema.safeParse(
        profile.escalation_ceiling,
    )
    if (!ceilingParsed.success) {
        return {
            valid: false,
            errorCode: 'ESCALATION_CEILING_BOUNDS_BREACH',
            reason:
                ceilingParsed.error.issues[0]?.message ??
                'Invalid escalation ceiling bounds',
        }
    }

    const statsParsed = BaseStatsSchema.safeParse(profile.base_stats)
    if (!statsParsed.success) {
        return {
            valid: false,
            errorCode: 'PERSONALITY_STAT_BOUNDS_BREACH',
            reason:
                statsParsed.error.issues[0]?.message ??
                'Personality stat outside [1, 5] bounds',
        }
    }

    return { valid: true }
}

/**
 * Scans a spoken dialogue turn against the character's forbidden attenuation tokens.
 */
export function scanAttenuationLeaks(
    dialogueText: string,
    attenuationTokens: readonly string[],
): AttenuationLeakDiagnosticBit[] {
    if (!dialogueText || attenuationTokens.length === 0) return []

    const leaks: AttenuationLeakDiagnosticBit[] = []
    const normalizedDialogue = dialogueText.toLowerCase()

    for (const token of attenuationTokens) {
        const cleanToken = token.trim().toLowerCase()
        if (cleanToken.length === 0) continue

        // Word boundary search to prevent substring false-positives
        const regex = new RegExp(`\\b${cleanToken}\\b`, 'i')
        const match = regex.exec(normalizedDialogue)
        if (match) {
            leaks.push({
                leaked_token: cleanToken,
                token_index: match.index,
            })
        }
    }

    return leaks
}

/**
 * Evaluates a proposed dialogue turn against an actor's conversational profile at Stage T_0 = $0.00.
 */
export function evaluateDialogueTurnPreflight(
    input: DialogueTurnEvaluationInput,
    profile: CharacterConversationalProfile,
): EscalationEvaluationResultBit {
    const parsedInput = DialogueTurnEvaluationInputSchema.safeParse(input)
    if (!parsedInput.success) {
        return {
            valid: false,
            actor_id: input?.actor_id ?? 'char_unknown',
            proposed_tier: input?.proposed_intensity_tier ?? 0,
            ceiling_tier: profile?.escalation_ceiling ?? 0,
            leaks: [],
            errorCode: 'SCHEMA_VALIDATION_ERROR',
            reason:
                parsedInput.error.issues[0]?.message ??
                'Invalid dialogue turn input',
        }
    }

    const {
        proposed_intensity_tier,
        spoken_dialogue_text,
        leverage_expended_count,
        override_authorized,
    } = parsedInput.data
    const ceiling = profile.escalation_ceiling

    // 1. Check Subtext Attenuation Token Leaks
    const leaks = scanAttenuationLeaks(
        spoken_dialogue_text,
        profile.attenuation_tokens,
    )
    if (
        leaks.length > 0 &&
        !profile.is_strained_break &&
        !override_authorized
    ) {
        return {
            valid: false,
            actor_id: profile.actor_id,
            proposed_tier: proposed_intensity_tier,
            ceiling_tier: ceiling,
            leaks,
            errorCode: 'SUBTEXT_ATTENUATION_LEAK',
            reason: `Dialogue leaked forbidden attenuation token(s): [${leaks.map((l) => l.leaked_token).join(', ')}]`,
        }
    }

    // 2. Check Intensity Escalation Ceiling
    if (proposed_intensity_tier > ceiling) {
        // Permitted only if leverage was expended or character has suffered a psychological break
        const isExemptionMet =
            leverage_expended_count > 0 ||
            profile.is_strained_break ||
            override_authorized
        if (!isExemptionMet) {
            return {
                valid: false,
                actor_id: profile.actor_id,
                proposed_tier: proposed_intensity_tier,
                ceiling_tier: ceiling,
                leaks: [],
                errorCode: 'CONVERSATIONAL_CEILING_BREACH',
                reason: `Proposed intensity tier (${proposed_intensity_tier}) exceeds actor escalation ceiling (${ceiling}) without leverage expenditure or break state`,
            }
        }
    }

    return {
        valid: true,
        actor_id: profile.actor_id,
        proposed_tier: proposed_intensity_tier,
        ceiling_tier: ceiling,
        leaks: [],
        errorCode: 'NONE',
    }
}

export const registerConversationalProfileBuzz = (
    cpy: EscalationModel,
    bal: EscalationBit<CharacterConversationalProfile>,
    ste: State,
) => {
    if (bal.dat) {
        const validated = CharacterConversationalProfileSchema.parse(bal.dat)
        cpy.profiles[validated.actor_id] = validated
    }
    if (bal.slv) {
        bal.slv({ escBit: { idx: bal.idx, val: 1 } })
    }
    return cpy
}

export const validateEscalationCeilingBuzz = async (
    cpy: EscalationModel,
    bal: EscalationBit<CharacterConversationalProfile>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ escBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const boundsCheck = validateEscalationBounds(bal.dat)
    if (!boundsCheck.valid) {
        await emitTelemetry(
            'cns00',
            `:: [ESCALATION:BOUNDS_FAIL] Actor ${bal.dat.actor_id}: ${boundsCheck.errorCode} -> ${boundsCheck.reason}`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [ESCALATION:BOUNDS_PASS] Actor ${bal.dat.actor_id}: Escalation ceiling ${bal.dat.escalation_ceiling} in [1, 5] bounds [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            escBit: {
                idx: bal.idx,
                val: boundsCheck.valid ? 1 : 0,
                dat: boundsCheck as any,
            },
        })
    }
    return cpy
}

export const evaluateDialogueTurnBuzz = async (
    cpy: EscalationModel,
    bal: EscalationBit<DialogueTurnEvaluationInput>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ escBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const profile = cpy.profiles[bal.dat.actor_id] ?? {
        actor_id: bal.dat.actor_id,
        escalation_ceiling: 3,
        base_stats: { spite: 3, cunning: 3, charm: 3, nerve: 3, warmth: 3 },
        attenuation_tokens: [],
        is_strained_break: false,
    }

    const result = evaluateDialogueTurnPreflight(bal.dat, profile)
    cpy.audit_history.push(result)

    if (!result.valid) {
        await emitTelemetry(
            'cns00',
            `:: [ESCALATION:BREACH] Actor ${result.actor_id}: ${result.errorCode} -> ${result.reason}`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [ESCALATION:TURN_OK] Actor ${result.actor_id}: Tier ${result.proposed_tier} <= Ceiling ${result.ceiling_tier} [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            escBit: { idx: bal.idx, val: result.valid ? 1 : 0, dat: result },
        })
    }
    return cpy
}
