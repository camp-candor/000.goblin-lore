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
    let invalidResult: {
        valid: boolean
        consecutiveDialogueCount: number
        violationIndex?: number
    } | null = null

    for (let i = 0; i < sequence.length; i++) {
        const node = sequence[i]
        if (node.type === 'DIALOGUE') {
            consecutiveCount++
            if (consecutiveCount > 3) {
                throw new Error(
                    `RHYTHM_BREACH: Exceeded maximum hard limit of 3 consecutive dialogue lines`,
                )
            }
            if (
                consecutiveCount > maxConsecutiveDialogueLines &&
                !invalidResult
            ) {
                invalidResult = {
                    valid: false,
                    consecutiveDialogueCount: consecutiveCount,
                    violationIndex: i,
                }
            } else if (
                consecutiveCount > maxConsecutiveDialogueLines &&
                invalidResult
            ) {
                invalidResult.consecutiveDialogueCount = consecutiveCount
            }
        } else if (node.type === 'BEAT' || node.type === 'ACTION') {
            consecutiveCount = 0
        }
    }

    if (invalidResult) {
        return invalidResult
    }

    return {
        valid: true,
        consecutiveDialogueCount: consecutiveCount,
    }
}
