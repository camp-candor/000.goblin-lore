import {
    APHONIC_CONDITIONS,
    MuteInvarianceQuery,
    MuteInvarianceReceipt,
    SpokenDialogueSpan,
} from '../val/muteInvariance.val'
import type State from '../../99.core/state'

const APHONIC_SET = new Set<string>(APHONIC_CONDITIONS)

/**
 * Extracts dialogue and quoted lines from text blocks and few-shot sections.
 */
export function extractSpokenDialogueUtterances(
    lines: string[],
): SpokenDialogueSpan[] {
    const utterances: SpokenDialogueSpan[] = []

    for (let idx = 0; idx < lines.length; idx++) {
        const raw = lines[idx].trim()
        if (raw.length === 0) continue

        // Check for quoted dialogue: "..." or '...'
        const quoteMatches = raw.match(/"([^"]+)"|'([^']+)'/g)
        if (quoteMatches && quoteMatches.length > 0) {
            for (const q of quoteMatches) {
                utterances.push({
                    rawText: q.replace(/^["']|["']$/g, '').trim(),
                    lineNumber: idx + 1,
                    isQuoted: true,
                })
            }
            continue
        }

        // Check for screenplay dialogue formatting: line contains words without descriptive stage asterisks
        const isStageDirection = raw.startsWith('(') && raw.endsWith(')')
        const isMarkdownComment = raw.startsWith('<!--') || raw.startsWith('//')
        if (!isStageDirection && !isMarkdownComment && /[a-zA-Z]/.test(raw)) {
            utterances.push({
                rawText: raw,
                lineNumber: idx + 1,
                isQuoted: false,
            })
        }
    }

    return utterances
}

/**
 * Determines whether the character is aphonic either via explicit flag or condition roll-up.
 */
export function isCharacterAphonic(
    canSpeak: boolean,
    conditions: string[],
): boolean {
    if (!canSpeak) return true
    for (const c of conditions) {
        if (APHONIC_SET.has(c.trim().toUpperCase())) {
            return true
        }
    }
    return false
}

/**
 * Verifies vocal invariance for a character at Stage T_0.
 */
export async function verifyMuteVocalInvariance(
    query: MuteInvarianceQuery,
    ste?: State,
): Promise<MuteInvarianceReceipt> {
    const {
        entityId,
        canSpeak,
        activeConditions,
        voiceRailFewShotLines,
        candidateDialogueBlocks,
    } = query
    const aphonic = isCharacterAphonic(canSpeak, activeConditions)

    // If character can speak, zero speech violations exist
    if (!aphonic) {
        return {
            allowed: true,
            entityId,
            canSpeak: true,
            breachCount: 0,
            breaches: [],
            remediationDirective: null,
            timestampEpochMs: Date.now(),
        }
    }

    // Aggregate candidate dialogue lines
    const combinedLines = [...voiceRailFewShotLines, ...candidateDialogueBlocks]
    const detectedUtterances = extractSpokenDialogueUtterances(combinedLines)

    const allowed = detectedUtterances.length === 0
    const remediationDirective = allowed
        ? null
        : `Actor ${entityId} is designated aphonic/mute. Replace spoken dialogue with physical gesture, facial affect, hand signal, or non-verbal tapping.`

    // Log breach to cns00 if state telemetry bus is provided
    if (!allowed && ste && typeof ste.hunt === 'function') {
        const logMsg = `>> [MUTE_VOCAL_INVARIANCE_BREACH] Actor ${entityId} has ${detectedUtterances.length} illegal spoken line(s). Halting at T_0 ($0.00 spend).`
        await ste
            .hunt('[Console action] Update Console', {
                idx: 'cns00',
                src: logMsg,
            })
            .catch(() => {})
    }

    return {
        allowed,
        entityId,
        canSpeak: false,
        breachCount: detectedUtterances.length,
        breaches: detectedUtterances,
        remediationDirective,
        timestampEpochMs: Date.now(),
    }
}
