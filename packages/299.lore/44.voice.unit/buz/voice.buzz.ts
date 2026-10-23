import { VoiceModel } from '../voice.model'
import type VoiceBit from '../fce/voice.bit'
import type State from '../../99.core/state'
import {
    ComedicRegisterEnum,
    COMEDIC_REGISTER_REGISTRY,
    BANNED_LATINATE_LEMMAS,
    type RegisterValidationResult,
    type ComedicRegister,
} from '../val/register.val'
import {
    extractSignificantLemmas,
    computeLemmaOverlapBps,
    type WantDifferentiationResult,
} from '../val/voiceRail.val'

export const initVoice = (
    cpy: VoiceModel,
    bal: VoiceBit,
    ste: State,
): VoiceModel => {
    if (bal.slv != null) {
        bal.slv({ vceBit: { idx: 'init-voice', val: 1 } })
    }
    return cpy
}

export const updateVoice = (
    cpy: VoiceModel,
    bal: VoiceBit,
    ste: State,
): VoiceModel => {
    if (bal.slv != null) {
        bal.slv({ vceBit: { idx: 'update-voice', dat: bal.dat } })
    }
    return cpy
}

/**
 * Parses and verifies Voice Rail sections from Markdown text.
 * Canonical headings:
 * - ## Wants (surface)
 * - ## Wants (actual)
 * - ## Blind spot (or ## Blind spot))
 * - ## Voice notes
 * - ## Few-shot lines
 */
export const parseVoiceRail = (
    cpy: VoiceModel,
    bal: VoiceBit,
    ste: State,
): VoiceModel => {
    const content = String(bal.src ?? '')
    const hasSurfaceWant = content.includes('## Wants (surface)')
    const hasActualWant = content.includes('## Wants (actual)')
    const hasBlindSpot =
        content.includes('## Blind spot') || content.includes('## Blind spot)')
    const hasVoiceNotes = content.includes('## Voice notes')
    const hasFewShot = content.includes('## Few-shot lines')

    const isValid =
        hasSurfaceWant &&
        hasActualWant &&
        hasBlindSpot &&
        hasVoiceNotes &&
        hasFewShot

    if (bal.slv != null) {
        bal.slv({
            vceBit: {
                idx: 'parse-voice-rail',
                val: isValid ? 1 : 0,
                dat: {
                    hasSurfaceWant,
                    hasActualWant,
                    hasBlindSpot,
                    hasVoiceNotes,
                    hasFewShot,
                    isValid,
                },
            },
        })
    }
    return cpy
}

/**
 * Extracts sections, measures subtext contrast, and validates the Surface vs Actual Want differential.
 */
export const differentiateWants = (
    cpy: VoiceModel,
    bal: VoiceBit,
    ste: State,
): VoiceModel => {
    const markdown = String(bal.src ?? '')
    const characterId = String(bal.idx ?? 'char_unknown')

    // Check for leaked citation markers or unedited HTML comment placeholders
    const hasCitationLeak = /\[cite:[^\]]*\]/i.test(markdown)
    const hasCommentLeak = /<!--[\s\S]*?-->/.test(markdown)
    const cleanOfArtifacts = !hasCitationLeak && !hasCommentLeak

    // Extract individual markdown section texts
    const extractSection = (
        heading: string,
        nextHeadingRegex: RegExp,
    ): string => {
        const idx = markdown.indexOf(heading)
        if (idx === -1) return ''
        const slice = markdown.slice(idx + heading.length)
        const match = slice.search(nextHeadingRegex)
        const body = match === -1 ? slice : slice.slice(0, match)
        return body.trim()
    }

    const surfaceWant = extractSection('## Wants (surface)', /\n##\s+/)
    const actualWant = extractSection('## Wants (actual)', /\n##\s+/)
    const blindSpot = extractSection('## Blind spot', /\n##\s+/)
    const voiceNotes = extractSection('## Voice notes', /\n##\s+/)
    const fewShotRaw = extractSection('## Few-shot lines', /\n##\s+|$|\n---\s*/)

    const fewShotLines = fewShotRaw
        .split('\n')
        .map((line) => line.replace(/^[-*]\s*/, '').trim())
        .filter((line) => line.length > 0 && !line.startsWith('#'))

    const hasAllSections =
        surfaceWant.length > 0 &&
        actualWant.length > 0 &&
        blindSpot.length > 0 &&
        voiceNotes.length > 0 &&
        fewShotLines.length > 0

    // Calculate lemma contrast
    const lemmasSurface = extractSignificantLemmas(surfaceWant)
    const lemmasActual = extractSignificantLemmas(actualWant)
    const overlapBps = computeLemmaOverlapBps(lemmasSurface, lemmasActual)

    // Surface Want and Actual Want must not be identical and lemma overlap must not exceed 60.0% (6000 bps)
    const isIdentical = surfaceWant.toLowerCase() === actualWant.toLowerCase()
    const contrastPass = !isIdentical && overlapBps <= 6000

    let errorReason: string | undefined = undefined
    if (!cleanOfArtifacts) {
        errorReason =
            'LEAKAGE_BREACH: Unedited HTML comments or citation tags detected in voice rail'
    } else if (!hasAllSections) {
        errorReason =
            'SECTION_MISSING_BREACH: One or more required Voice Rail sections are absent or empty'
    } else if (isIdentical) {
        errorReason =
            'SUBTEXT_IDENTITY_BREACH: Surface want is identical to actual want'
    } else if (!contrastPass) {
        errorReason = `SUBTEXT_CONTRAST_BREACH: Lemma overlap of ${overlapBps} bps exceeds ceiling of 6000 bps (60.0%)`
    }

    const isValid = cleanOfArtifacts && hasAllSections && contrastPass

    const result: WantDifferentiationResult = {
        characterId,
        hasAllSections,
        surfaceWant,
        actualWant,
        blindSpot,
        voiceNotes,
        fewShotLineCount: fewShotLines.length,
        overlapPercentageBps: overlapBps,
        contrastPass,
        cleanOfArtifacts,
        isValid,
        errorReason,
    }

    if (bal.slv != null) {
        bal.slv({
            vceBit: {
                idx: 'differentiate-wants',
                val: isValid ? 1 : 0,
                dat: result,
            },
        })
    }

    return cpy
}

/**
 * Validates comedic register tag conformance and scans for banned Latinate tokens.
 */
export const validateComedicRegister = (
    cpy: VoiceModel,
    bal: VoiceBit,
    ste: State,
): VoiceModel => {
    const characterId = String(bal.idx ?? 'char_unknown')
    const candidateRegister = bal.dat?.register ?? bal.src
    const sampleProse = String(bal.dat?.prose ?? '')

    // 1. Validate Register Enum Conformance
    const parseResult = ComedicRegisterEnum.safeParse(candidateRegister)
    if (!parseResult.success) {
        const failure: RegisterValidationResult = {
            characterId,
            register: 'deadpan',
            instructionDirective: '',
            detectedSlopTokens: [],
            isValid: false,
            errorCode: 'INVALID_COMEDIC_REGISTER_BREACH',
            message: `Invalid comedic register '${String(candidateRegister)}'. Must match ComedicRegisterEnum.`,
        }
        if (bal.slv != null) {
            bal.slv({
                vceBit: {
                    idx: 'validate-comedic-register',
                    val: 0,
                    dat: failure,
                },
            })
        }
        return cpy
    }

    const validRegister: ComedicRegister = parseResult.data
    const definition = COMEDIC_REGISTER_REGISTRY[validRegister]

    // 2. Scan prose for banned Latinate tokens
    const lowerProse = sampleProse.toLowerCase()
    const detectedSlopTokens: string[] = []

    for (const token of BANNED_LATINATE_LEMMAS) {
        const wordBoundaryRegex = new RegExp(`\\b${token}\\b`, 'i')
        if (wordBoundaryRegex.test(lowerProse)) {
            detectedSlopTokens.push(token)
        }
    }

    const hasSlop = detectedSlopTokens.length > 0
    const isValid = !hasSlop

    const result: RegisterValidationResult = {
        characterId,
        register: validRegister,
        instructionDirective: definition.instructionDirective,
        detectedSlopTokens,
        isValid,
        errorCode: hasSlop ? 'BANNED_LATINATE_SLOP_BREACH' : undefined,
        message: hasSlop
            ? `Prohibited Latinate slop tokens detected in voice rail: [${detectedSlopTokens.join(', ')}]`
            : `Comedic register '${validRegister}' validated with zero Latinate slop tokens.`,
    }

    if (bal.slv != null) {
        bal.slv({
            vceBit: {
                idx: 'validate-comedic-register',
                val: isValid ? 1 : 0,
                dat: result,
            },
        })
    }

    return cpy
}
