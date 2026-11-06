import {
    TTSGenerationRequestSchema,
    assertIntegerMetric,
    type TTSGenerationRequest,
} from '../val/ttsPayload.val.js'
import type { TTSPayloadValidationReceiptBit } from '../fce/ttsPayload.bit.js'

export function validateTtsGenerationPayload(candidate: unknown): {
    request: TTSGenerationRequest
    receipt: TTSPayloadValidationReceiptBit
} {
    const parsed = TTSGenerationRequestSchema.parse(candidate)

    for (const [slug, version] of Object.entries(parsed.pinnedFactVersions)) {
        assertIntegerMetric(version, `pinnedFactVersion for ${slug}`)
    }

    const receipt: TTSPayloadValidationReceiptBit = Object.freeze({
        status: 'PASSED',
        lineId: parsed.lineId,
        characterId: parsed.characterId,
        canSpeak: parsed.somaticMask.canSpeak,
        pinnedFactCount: Object.keys(parsed.pinnedFactVersions).length,
        isStrictlyConformant: true,
    })

    return {
        request: Object.freeze(parsed),
        receipt,
    }
}

export interface DialogueNodeCandidate {
    type: 'DIALOGUE' | 'BEAT' | 'ACTION'
    speakerId?: string
    text?: string
}

export function assertDialogueRhythmRatio(
    sequence: readonly DialogueNodeCandidate[],
    maxConsecutiveDialogueLines: number = 2,
): {
    valid: boolean
    consecutiveDialogueCount: number
    violationIndex?: number
} {
    let consecutiveCount = 0

    for (let i = 0; i < sequence.length; i++) {
        const node = sequence[i]
        if (node.type === 'DIALOGUE') {
            consecutiveCount++
            if (consecutiveCount > 3) {
                throw new Error(
                    `RHYTHM_BREACH: Exceeded maximum hard limit of 3 consecutive dialogue lines without action or beat at index ${i}`,
                )
            }
            if (consecutiveCount > maxConsecutiveDialogueLines) {
                // If it's the last element, we return the validation object.
                // But wait, if there are MORE dialogue lines, it will hit > 3 and throw.
                // We should check if any FUTURE elements will cause a throw before returning early!
            }
        } else if (node.type === 'BEAT' || node.type === 'ACTION') {
            consecutiveCount = 0
        }
    }

    // Now re-evaluate the sequence to find the maxConsecutiveDialogueLines violation
    consecutiveCount = 0
    for (let i = 0; i < sequence.length; i++) {
        const node = sequence[i]
        if (node.type === 'DIALOGUE') {
            consecutiveCount++
            if (consecutiveCount > maxConsecutiveDialogueLines) {
                return {
                    valid: false,
                    consecutiveDialogueCount: consecutiveCount,
                    violationIndex: i,
                }
            }
        } else if (node.type === 'BEAT' || node.type === 'ACTION') {
            consecutiveCount = 0
        }
    }

    return {
        valid: true,
        consecutiveDialogueCount: consecutiveCount,
    }
}
