import { describe, it, expect } from 'vitest'
import {
    TTSGenerationRequestSchema,
    assertIntegerMetric,
    type TTSGenerationRequest,
} from '../val/ttsPayload.val.js'
import {
    validateTtsGenerationPayload,
    assertDialogueRhythmRatio,
} from '../buz/validateTtsPayload.buzz.js'
import { PayloadModel } from '../payload.model.js'
import { initPayload, validateTtsPayload } from '../payload.buzzer.js'

describe('22.payload.unit :: Task 6.1 Author Synthesis Ingress Payload Schema', () => {
    const validRequestPayload: TTSGenerationRequest = {
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

    it('asserts integer metric invariants and prohibits floating-point numbers', () => {
        expect(() =>
            assertIntegerMetric(18, 'clampedBeatDurationFrames'),
        ).not.toThrow()
        expect(() =>
            assertIntegerMetric(18.5, 'clampedBeatDurationFrames'),
        ).toThrowError('[FLOAT_PROHIBITED]')
        expect(() => assertIntegerMetric(NaN, 'factVersion')).toThrowError(
            '[FLOAT_PROHIBITED]',
        )
    })

    it('validates a compliant TTSGenerationRequest and deep-freezes output', () => {
        const { request, receipt } =
            validateTtsGenerationPayload(validRequestPayload)

        expect(request.lineId).toBe('line_wart_001')
        expect(request.characterId).toBe('char_wart')
        expect(receipt.status).toBe('PASSED')
        expect(receipt.pinnedFactCount).toBe(2)
        expect(receipt.isStrictlyConformant).toBe(true)
        expect(Object.isFrozen(request)).toBe(true)
        expect(Object.isFrozen(receipt)).toBe(true)
    })

    it('rejects undeclared or hallucinated keys via strict schema closure', () => {
        const roguePayload = {
            ...validRequestPayload,
            hallucinatedKey: 'ILLEGAL_VALUE',
        }
        expect(() => TTSGenerationRequestSchema.parse(roguePayload)).toThrow()
    })

    it('rejects multi-byte UTF-8 emojis or non-ASCII characters in verbatimText', () => {
        const emojiPayload = {
            ...validRequestPayload,
            verbatimText: 'Keep the tallow dry \u{1F525} now!',
        }
        expect(() => TTSGenerationRequestSchema.parse(emojiPayload)).toThrow(
            'NON_ASCII_DIALOGUE_DETECTED',
        )
    })

    it('halts execution with VOCAL_DELIVERY_BREACH if an aphonic character attempts dialogue', () => {
        const aphonicPayload: TTSGenerationRequest = {
            ...validRequestPayload,
            somaticMask: {
                ...validRequestPayload.somaticMask,
                canSpeak: false,
                activeConditions: ['cnd_crushed_larynx', 'MUTE'],
            },
        }
        expect(() => TTSGenerationRequestSchema.parse(aphonicPayload)).toThrow(
            'VOCAL_DELIVERY_BREACH: Aphonic character cannot phonate verbal dialogue',
        )
    })

    it('validates silence-to-speech rhythm ratios and forbids >3 consecutive dialogue nodes', () => {
        // Compliant sequence with interleaved beats
        const compliantSeq = [
            { type: 'DIALOGUE' as const, text: 'One' },
            { type: 'DIALOGUE' as const, text: 'Two' },
            { type: 'BEAT' as const },
            { type: 'DIALOGUE' as const, text: 'Three' },
        ]
        expect(assertDialogueRhythmRatio(compliantSeq, 2).valid).toBe(true)

        // Warning state exceeding configured 2-line threshold
        const threeLines = [
            { type: 'DIALOGUE' as const, text: 'One' },
            { type: 'DIALOGUE' as const, text: 'Two' },
            { type: 'DIALOGUE' as const, text: 'Three' },
        ]
        const check = assertDialogueRhythmRatio(threeLines, 2)
        expect(check.valid).toBe(false)
        expect(check.consecutiveDialogueCount).toBe(3)

        // Hard failure exceeding 3 consecutive lines
        const fourLines = [
            { type: 'DIALOGUE' as const, text: 'One' },
            { type: 'DIALOGUE' as const, text: 'Two' },
            { type: 'DIALOGUE' as const, text: 'Three' },
            { type: 'DIALOGUE' as const, text: 'Four' },
        ]
        expect(() => assertDialogueRhythmRatio(fourLines, 2)).toThrowError(
            'RHYTHM_BREACH: Exceeded maximum hard limit of 3 consecutive dialogue lines',
        )
    })

    it('executes payload validation buzzer through PayloadModel reducer flow', async () => {
        const model = new PayloadModel()
        initPayload(model, { idx: 'init' }, {} as any)

        let emittedReceipt: any
        validateTtsPayload(
            model,
            {
                idx: 'validate-test',
                dat: { candidatePayload: validRequestPayload },
                slv: (res) => {
                    emittedReceipt = res.pldBit.dat
                },
            },
            { hunt: async () => {} } as any,
        )

        expect(emittedReceipt).toBeDefined()
        expect(emittedReceipt.status).toBe('PASSED')
        expect(model.validatedPayloads['line_wart_001']).toBeDefined()
        expect(model.totalValidatedCount).toBe(1)
    })
})
