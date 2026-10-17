import type {
    BannedCadence,
    CharacterVocalProfile,
    ProposedDialogueLine,
    VocalTractCondition,
} from '../schemas/somaticTrauma.js'

export interface VocalFeasibilityResult {
    satisfiable: boolean
    errorCode?:
        | 'VOCAL_DELIVERY_BREACH'
        | 'PROSODIC_EXCLUSION_BREACH'
        | 'POST_MORTEM_VOCAL_BREACH'
        | 'UNCONSCIOUS_VOCAL_BREACH'
    violatingTokens: string[]
    reason?: string
    errorVector?: {
        domain: 'SOMATIC_VOCAL'
        target_entity: string
        rule_id: string
        offending_tokens: string[]
    }
}

export class VocalFeasibilityEngine {
    private static readonly VOCAL_TRAUMA_CONDITIONS: ReadonlySet<VocalTractCondition> =
        new Set([
            'mute',
            'crushed_larynx',
            'severed_trachea',
            'bilateral_vocal_cord_paralysis',
            'acute_asphyxiation',
        ])

    /**
     * Evaluates the Vocal-Motor Feasibility Theorem at Stage T0 = $0.00:
     * c.has_verbal_directives => ("mute" not in c.conditions and
     * "speak" not in c.banned_verbs and c.vitality_bps > 0)
     */
    public static evaluateFeasibility(
        profile: CharacterVocalProfile,
        proposedLine: ProposedDialogueLine,
    ): VocalFeasibilityResult {
        const hasSpokenWords = proposedLine.dialogue_text.trim().length > 0

        // Check 1: Post-Mortem Vocal Attempt
        if (profile.vitality_bps === 0) {
            if (hasSpokenWords || proposedLine.is_non_verbal_expression) {
                return {
                    satisfiable: false,
                    errorCode: 'POST_MORTEM_VOCAL_BREACH',
                    violatingTokens: ['DECEASED_ACTOR_VITALITY_ZERO'],
                    reason: `POST_MORTEM_ERROR: Actor '${profile.character_id}' vitality is 0. Deceased actors cannot vocalize.`,
                    errorVector: {
                        domain: 'SOMATIC_VOCAL',
                        target_entity: profile.character_id,
                        rule_id: 'POST_MORTEM_VOCAL_BREACH',
                        offending_tokens: ['vitality_bps: 0'],
                    },
                }
            }
            return { satisfiable: true, violatingTokens: [] }
        }

        // Check 2: Unconscious Vocal Attempt
        if (!profile.is_conscious && hasSpokenWords) {
            return {
                satisfiable: false,
                errorCode: 'UNCONSCIOUS_VOCAL_BREACH',
                violatingTokens: ['UNCONSCIOUS_STATE'],
                reason: `UNCONSCIOUS_ERROR: Actor '${profile.character_id}' is unconscious and cannot articulate dialogue.`,
                errorVector: {
                    domain: 'SOMATIC_VOCAL',
                    target_entity: profile.character_id,
                    rule_id: 'UNCONSCIOUS_VOCAL_BREACH',
                    offending_tokens: ['is_conscious: false'],
                },
            }
        }

        // Check 3: Physical Gasp & Exertion Exception
        // Non-verbal gasps, coughs, and wheezes are permitted IF
        // dialogue_text is strictly empty
        if (!hasSpokenWords && proposedLine.is_non_verbal_expression) {
            return {
                satisfiable: true,
                violatingTokens: [],
            }
        }

        // Check 4: The Vocal-Motor Feasibility Theorem for Spoken Dialogue
        if (hasSpokenWords) {
            const activeTrauma = profile.active_conditions.filter((cond) =>
                this.VOCAL_TRAUMA_CONDITIONS.has(cond),
            )

            const bannedVerbsUpper = new Set(
                profile.banned_kinetic_verbs.map((v) => v.toUpperCase()),
            )
            const isSpeechBanned =
                bannedVerbsUpper.has('SPEAK') ||
                bannedVerbsUpper.has('WHISPER') ||
                bannedVerbsUpper.has('SHOUT')

            if (activeTrauma.length > 0 || isSpeechBanned) {
                const violations = [
                    ...activeTrauma,
                    ...(isSpeechBanned ? ['BANNED_VERB_SPEAK'] : []),
                ]

                return {
                    satisfiable: false,
                    errorCode: 'VOCAL_DELIVERY_BREACH',
                    violatingTokens: violations,
                    reason: `VOCAL_DELIVERY_BREACH: Actor '${profile.character_id}' has vocal impairment [${violations.join(', ')}] but is assigned spoken dialogue: "${proposedLine.dialogue_text}".`,
                    errorVector: {
                        domain: 'SOMATIC_VOCAL',
                        target_entity: profile.character_id,
                        rule_id: 'VOCAL_DELIVERY_BREACH',
                        offending_tokens: violations,
                    },
                }
            }
        }

        // Check 5: Prosodic Cadence Exclusion Firewall
        if (proposedLine.delivery_cadences.length > 0) {
            const bannedCadenceSet = new Set<BannedCadence>(
                profile.banned_cadences,
            )
            const cadenceBreaches = proposedLine.delivery_cadences.filter((c) =>
                bannedCadenceSet.has(c),
            )

            if (cadenceBreaches.length > 0) {
                return {
                    satisfiable: false,
                    errorCode: 'PROSODIC_EXCLUSION_BREACH',
                    violatingTokens: cadenceBreaches,
                    reason: `PROSODIC_EXCLUSION_BREACH: Cadences [${cadenceBreaches.join(', ')}] are blacklisted for actor '${profile.character_id}'.`,
                    errorVector: {
                        domain: 'SOMATIC_VOCAL',
                        target_entity: profile.character_id,
                        rule_id: 'PROSODIC_EXCLUSION_BREACH',
                        offending_tokens: cadenceBreaches,
                    },
                }
            }
        }

        return {
            satisfiable: true,
            violatingTokens: [],
        }
    }
}

export function evaluateVocalFeasibility(
    profile: CharacterVocalProfile,
    proposedLine: ProposedDialogueLine,
): VocalFeasibilityResult {
    return VocalFeasibilityEngine.evaluateFeasibility(profile, proposedLine)
}

export function evaluateFeasibility(
    profile: CharacterVocalProfile,
    proposedLine: ProposedDialogueLine,
): VocalFeasibilityResult {
    return VocalFeasibilityEngine.evaluateFeasibility(profile, proposedLine)
}
