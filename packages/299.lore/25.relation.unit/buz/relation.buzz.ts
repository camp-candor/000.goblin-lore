import { RelationModel } from '../relation.model'
import RelationBit from '../fce/relation.bit'
import State from '../../99.core/state'
import {
    CharacterRelationProfileSchema,
    CharacterRelationProfile,
    BuildEpistemicPromptInputSchema,
    BuildEpistemicPromptInput,
    DyadicAttitude,
} from '../val/relation.val'
import { CompiledEpistemicPromptBit } from '../fce/relation.interface'

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

export const initRelation = (
    cpy: RelationModel,
    bal: RelationBit,
    ste: State,
) => {
    cpy.profiles = {}
    cpy.errors = []
    if (bal.slv) {
        bal.slv({ relBit: { idx: 'init-relation', val: 1 } })
    }
    return cpy
}

export const updateRelation = (
    cpy: RelationModel,
    bal: RelationBit,
    ste: State,
) => {
    if (bal.slv) {
        bal.slv({ relBit: { idx: 'update-relation', val: 1 } })
    }
    return cpy
}

/**
 * Resolves the active dyadic attitude of an actor toward a designated interlocutor.
 * Falls back to 'COLD_INDIFFERENCE' if unmapped.
 */
export function resolveDyadicAttitude(
    profile: CharacterRelationProfile,
    interlocutorId: string,
): DyadicAttitude {
    if (profile.actor_id === interlocutorId) {
        throw new Error(
            `ANTI_REFLEXIVITY_RELATION_BREACH: Character ${profile.actor_id} cannot resolve relationship attitude toward self`,
        )
    }
    return profile.relationship_defaults[interlocutorId] ?? 'COLD_INDIFFERENCE'
}

/**
 * Compiles a localized, scrubbed epistemic prompt directive slice for an actor.
 * Enforces Ignorance by Omission and applies dyadic friction constraints.
 */
export function buildCharacterEpistemicPrompt(
    input: BuildEpistemicPromptInput,
): CompiledEpistemicPromptBit {
    const parsed = BuildEpistemicPromptInputSchema.parse(input)
    const {
        actor_id,
        interlocutor_id,
        profile,
        known_propositions,
        leverage_held_over_partner,
    } = parsed

    const activeAttitude = resolveDyadicAttitude(profile, interlocutor_id)
    const promptLines: string[] = []

    promptLines.push(
        `[DYADIC STANCE TOWARD ${interlocutor_id}] : ${activeAttitude}`,
    )
    if (leverage_held_over_partner > 0) {
        promptLines.push(
            `[LEVERAGE ASYMMETRY] : Holds ${leverage_held_over_partner} debt string(s) over ${interlocutor_id}. Concessions may be forced.`,
        )
    }

    // Check matching redirection rules
    const matchingRule = profile.redirection_rules.find(
        (r) => r.partner_id === interlocutor_id,
    )
    if (matchingRule) {
        promptLines.push(
            `[CONFLICT DEFLECTION MANDATE] : When pressed on "${matchingRule.trigger_keyword}", deflect conversation to sideways topic: "${matchingRule.sideways_topic_ascii}".`,
        )
    }

    let omittedCount = 0
    let hearsayCount = 0

    promptLines.push('[BELIEVED WORLD KNOWLEDGE]')
    for (const prop of known_propositions) {
        if (prop.standing_tier === 'TOTAL_IGNORANCE') {
            // Ignorance by Omission: Physically omitted from context
            omittedCount += 1
            continue
        }

        if (
            prop.standing_tier === 'RUMOR_ONLY' ||
            prop.standing_tier === 'FALSE_BELIEF'
        ) {
            promptLines.push(`- [UNVERIFIED HEARSAY] ${prop.claim_ascii}`)
            hearsayCount += 1
        } else {
            promptLines.push(`- ${prop.claim_ascii}`)
        }
    }

    return {
        actor_id,
        interlocutor_id,
        active_attitude: activeAttitude,
        prompt_directive_lines: promptLines,
        omitted_proposition_count: omittedCount,
        hearsay_proposition_count: hearsayCount,
    }
}

export const registerRelationProfileBuzz = (
    cpy: RelationModel,
    bal: RelationBit<CharacterRelationProfile>,
    ste: State,
) => {
    if (bal.dat) {
        const validated = CharacterRelationProfileSchema.parse(bal.dat)
        cpy.profiles[validated.actor_id] = validated
    }
    if (bal.slv) {
        bal.slv({ relBit: { idx: bal.idx, val: 1 } })
    }
    return cpy
}

export const resolveDyadicAttitudeBuzz = async (
    cpy: RelationModel,
    bal: RelationBit<{ actor_id: string; interlocutor_id: string }>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ relBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const profile = cpy.profiles[bal.dat.actor_id] ?? {
        actor_id: bal.dat.actor_id,
        relationship_defaults: {},
        redirection_rules: [],
    }

    try {
        const attitude = resolveDyadicAttitude(profile, bal.dat.interlocutor_id)
        await emitTelemetry(
            'cns00',
            `>> [RELATION:RESOLVE_OK] ${bal.dat.actor_id} -> ${bal.dat.interlocutor_id}: ${attitude} [OK]`,
        )

        if (bal.slv) {
            bal.slv({ relBit: { idx: bal.idx, val: 1, src: attitude } })
        }
    } catch (err: unknown) {
        const msg = (err as Error).message
        await emitTelemetry('cns00', `:: [RELATION:BREACH] ${msg}`)
        if (bal.slv) {
            bal.slv({ relBit: { idx: bal.idx, val: 0, src: msg } })
        }
    }
    return cpy
}

export const buildEpistemicPromptBuzz = async (
    cpy: RelationModel,
    bal: RelationBit<BuildEpistemicPromptInput>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ relBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    try {
        const result = buildCharacterEpistemicPrompt(bal.dat)
        await emitTelemetry(
            'cns00',
            `>> [RELATION:PROMPT_OK] Built epistemic prompt for ${result.actor_id} (Omitted: ${result.omitted_proposition_count}, Hearsay: ${result.hearsay_proposition_count}) [OK]`,
        )

        if (bal.slv) {
            bal.slv({
                relBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: result as unknown as CharacterRelationProfile,
                },
            })
        }
    } catch (err: unknown) {
        const msg = (err as Error).message
        await emitTelemetry('cns00', `:: [RELATION:PROMPT_ERR] ${msg}`)
        if (bal.slv) {
            bal.slv({ relBit: { idx: bal.idx, val: 0, src: msg } })
        }
    }
    return cpy
}
