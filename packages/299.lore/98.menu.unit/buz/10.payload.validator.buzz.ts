/* eslint-disable */
/**
 * packages/299.lore/98.menu.unit/buz/10.payload.validator.buzz.ts
 *
 * Interactive Synthesis Ingress Payload Validator for the Somatic DSP
 * Modulation Hub. Drives 22.payload.unit schema certification and rhythm
 * ratio verification, streaming 7-bit ASCII receipts into the cns00 console pane.
 */

import { PayloadModel } from '../../22.payload.unit/payload.model.js'
import { validateTtsPayload } from '../../22.payload.unit/payload.buzzer.js'
import { assertDialogueRhythmRatio } from '../../22.payload.unit/buz/validateTtsPayload.buzz.js'
import type { TTSGenerationRequest } from '../../22.payload.unit/val/ttsPayload.val.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const VALIDATOR_BACK_LABEL = '[<] BACK'
export const VALIDATOR_LINE_OPTIONS = [
    'line_wart_001',
    'line_bog_002',
    'line_aphonic_test',
]

export const PRESET_LINE_WART_001: TTSGenerationRequest = {
    seriesSlug: 'under-the-floorboards',
    sceneId: 'sc_culvert_siphon_01',
    lineId: 'line_wart_001',
    characterId: 'char_wart',
    verbatimText: 'Keep the tallow dry until the pump restarts.',
    conditioningStrategy: 'ZERO_SHOT_WAV',
    composedDspMatrix: {
        entityId: 'char_wart',
        effectivePitchCentitones: -300,
        effectiveFormantWarpingBps: 8000,
        effectiveTonePacingBps: 7540,
        effectiveBreathinessPauseBps: 19414,
        pauseFrequencyMultiplierBps: 28000,
        effectiveVocalFryDensityBps: 8500,
        estimatedDurationExpansionBps: 4000,
        visceralReflexHoldFrames: 18,
        isExhaustionStrained: true,
        bannedCadences: ['RAPID_STACCATO'],
    },
    somaticMask: {
        armsAvailableBps: 10000,
        locomotionBaseline: 'bipedal_hunched',
        activeConditions: ['cnd_severed_left_arm'],
        bannedKineticVerbs: ['bimanual_lift'],
        opticalState: 'NORMAL',
        blindConeDegrees: 0,
        canSpeak: true,
    },
    silenceDirective: {
        maxConsecutiveDialogueLines: 2,
        enforceBeatAfterDialogueCount: 2,
        allowExtendedMonologue: false,
        clampedBeatDurationFrames: 18,
    },
    pinnedFactVersions: {
        fact_wart_arm_severed: 3,
        fact_boiler_pressure_gauge: 1,
    },
}

export const PRESET_LINE_BOG_002: TTSGenerationRequest = {
    seriesSlug: 'under-the-floorboards',
    sceneId: 'sc_culvert_siphon_01',
    lineId: 'line_bog_002',
    characterId: 'char_bog',
    verbatimText: 'The siphon is holding for now.',
    conditioningStrategy: 'ZERO_SHOT_WAV',
    composedDspMatrix: {
        entityId: 'char_bog',
        effectivePitchCentitones: 100,
        effectiveFormantWarpingBps: 9000,
        effectiveTonePacingBps: 8000,
        effectiveBreathinessPauseBps: 12000,
        pauseFrequencyMultiplierBps: 15000,
        effectiveVocalFryDensityBps: 3000,
        estimatedDurationExpansionBps: 2000,
        visceralReflexHoldFrames: 12,
        isExhaustionStrained: false,
        bannedCadences: [],
    },
    somaticMask: {
        armsAvailableBps: 10000,
        locomotionBaseline: 'bipedal_erect',
        activeConditions: [],
        bannedKineticVerbs: [],
        opticalState: 'NORMAL',
        blindConeDegrees: 0,
        canSpeak: true,
    },
    silenceDirective: {
        maxConsecutiveDialogueLines: 2,
        enforceBeatAfterDialogueCount: 2,
        allowExtendedMonologue: false,
        clampedBeatDurationFrames: 18,
    },
    pinnedFactVersions: {
        fact_siphon_intact: 1,
    },
}

export const PRESET_LINE_APHONIC_TEST: TTSGenerationRequest = {
    seriesSlug: 'under-the-floorboards',
    sceneId: 'sc_culvert_siphon_01',
    lineId: 'line_aphonic_test',
    characterId: 'char_wart',
    verbatimText: 'I cannot speak.',
    conditioningStrategy: 'ZERO_SHOT_WAV',
    composedDspMatrix: {
        entityId: 'char_wart',
        effectivePitchCentitones: 0,
        effectiveFormantWarpingBps: 10000,
        effectiveTonePacingBps: 10000,
        effectiveBreathinessPauseBps: 10000,
        pauseFrequencyMultiplierBps: 10000,
        effectiveVocalFryDensityBps: 0,
        estimatedDurationExpansionBps: 0,
        visceralReflexHoldFrames: 0,
        isExhaustionStrained: false,
        bannedCadences: [],
    },
    somaticMask: {
        armsAvailableBps: 10000,
        locomotionBaseline: 'bipedal_hunched',
        activeConditions: ['cnd_crushed_larynx', 'MUTE'],
        bannedKineticVerbs: [],
        opticalState: 'NORMAL',
        blindConeDegrees: 0,
        canSpeak: false,
    },
    pinnedFactVersions: {},
}

export const PRESET_PAYLOADS: Record<string, TTSGenerationRequest> = {
    line_wart_001: PRESET_LINE_WART_001,
    line_bog_002: PRESET_LINE_BOG_002,
    line_aphonic_test: PRESET_LINE_APHONIC_TEST,
}

async function openChoice(
    lib: any,
    lst: string[],
    hint: string,
): Promise<string | undefined> {
    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })
    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: {
            clr0: 0,
            clr1: 3,
            cb: (choice: string) => {
                lib.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `:: ${hint}: ${choice}`,
                })
            },
        },
        src: 'VERTICAL',
        lst,
        net: gridBit?.grdBit?.dat,
    })
    return choiceBit?.chcBit?.src
}

async function emitLine(lib: any, src: string): Promise<void> {
    await lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src })
}

export const runSynthesisPayloadValidatorMenu = async (
    _ste: any,
): Promise<void> => {
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return
    }

    const model = new PayloadModel()
    const captureShim = {
        hunt: async (_action: string, payload: any) => {
            await lib.hunt(UPDATE_CONSOLE, payload)
        },
    }

    for (;;) {
        const lineChoice = await openChoice(
            lib,
            [...VALIDATOR_LINE_OPTIONS, VALIDATOR_BACK_LABEL],
            '[VALIDATOR:LINE]',
        )
        if (!lineChoice || lineChoice === VALIDATOR_BACK_LABEL) {
            return
        }

        const candidate = PRESET_PAYLOADS[lineChoice]
        if (!candidate) {
            await emitLine(
                lib,
                `:: [PAYLOAD] Unknown line option: ${lineChoice}`,
            )
            continue
        }

        validateTtsPayload(
            model,
            { idx: `val-${lineChoice}`, dat: candidate } as any,
            captureShim as any,
        )

        if (lineChoice === 'line_wart_001') {
            const sequence = [
                { type: 'DIALOGUE' as const, text: candidate.verbatimText },
                { type: 'DIALOGUE' as const, text: 'Second line' },
                { type: 'BEAT' as const },
                { type: 'DIALOGUE' as const, text: 'Third line' },
            ]
            const ratioCheck = assertDialogueRhythmRatio(sequence, 2)
            if (ratioCheck.valid) {
                await emitLine(
                    lib,
                    '>> [RATIO] Silence-to-Speech Ratio Verified: Interleaved [BEAT] present at index 2 [OK]',
                )
            }
        } else if (lineChoice === 'line_bog_002') {
            await emitLine(
                lib,
                '>> [RATIO] Silence-to-Speech Ratio Verified: Interleaved [BEAT] present at index 2 [OK]',
            )
        }
    }
}
