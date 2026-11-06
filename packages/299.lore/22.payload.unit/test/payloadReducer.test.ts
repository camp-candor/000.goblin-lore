import { describe, it, expect } from 'vitest'
import { PayloadModel } from '../payload.model.js'
import { reducer } from '../payload.reduce.js'
import * as Act from '../payload.action.js'
import type { TTSGenerationRequest } from '../val/ttsPayload.val.js'
import type { VocalFeasibilityCandidate } from '../val/aphoniaGate.val.js'
import type { StalenessEvaluationInput } from '../val/factPinning.val.js'

describe('22.payload.unit :: Task 6.5 Wire Payload Serialization Reducer Actions', () => {
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

    const healthyActor: VocalFeasibilityCandidate = {
        entityId: 'char_bog',
        verbatimText: 'Move the lever now.',
        activeConditions: [],
        bannedKineticVerbs: [],
        isNonVerbalExpression: false,
    }

    const stalenessInput: StalenessEvaluationInput = {
        sceneId: 'sc_culvert_siphon_01',
        pinnedFacts: [
            {
                factId: 'fact_wart_arm_severed',
                pinnedVersion: 3,
                pinnedHash: 'a'.repeat(64),
                claimText: 'Wart severed left arm.',
                scope: 'CHARACTER',
            },
        ],
        liveLedgerFacts: {
            fact_wart_arm_severed: {
                factId: 'fact_wart_arm_severed',
                currentVersion: 3,
                contentHash: 'a'.repeat(64),
                claimText: 'Wart severed left arm.',
                isRetired: false,
            },
        },
    }

    const mockState = {
        hunt: async () => {},
    } as any

    it('initializes and clears payload state via Act.InitPayload', () => {
        const initialModel = new PayloadModel()
        initialModel.totalValidatedCount = 99

        let resVal = 0
        const action = new Act.InitPayload({
            idx: 'test-init',
            slv: (res) => {
                resVal = res.pldBit.val || 0
            },
        })

        const nextModel = reducer(initialModel, action, mockState)
        expect(resVal).toBe(1)
        expect(nextModel.totalValidatedCount).toBe(0)
        expect(nextModel.validatedPayloads).toEqual({})
    })

    it('delegates Act.ValidateTtsPayload through reducer and stores validated request', async () => {
        const model = new PayloadModel()
        let receipt: any

        const action = new Act.ValidateTtsPayload({
            idx: 'test-validate',
            dat: { candidatePayload: validRequestPayload },
            slv: (res) => {
                receipt = res.pldBit.dat
            },
        })

        reducer(model, action, mockState)

        // Wait a tick for async buzzer
        await new Promise((r) => setTimeout(r, 10))

        expect(receipt).toBeDefined()
        expect(receipt.status).toBe('PASSED')
    })

    it('delegates Act.VerifyVocalFeasibility through reducer and verifies phonation', async () => {
        const model = new PayloadModel()
        let feasibilityReceipt: any

        const action = new Act.VerifyVocalFeasibility({
            idx: 'test-feasibility',
            dat: { candidate: healthyActor, epoch: 1 },
            slv: (res) => {
                feasibilityReceipt = res.pldBit.dat
            },
        })

        reducer(model, action, mockState)
        await new Promise((r) => setTimeout(r, 10))

        expect(feasibilityReceipt).toBeDefined()
        expect(feasibilityReceipt.isPhonationFeasible).toBe(true)
    })

    it('delegates Act.CheckSceneSomaticStaleness through reducer and flags clean state', async () => {
        const model = new PayloadModel()
        let stalenessReceipt: any

        const action = new Act.CheckSceneSomaticStaleness({
            idx: 'test-staleness',
            dat: { stalenessInput, epoch: 2 },
            slv: (res) => {
                stalenessReceipt = res.pldBit.dat
            },
        })

        reducer(model, action, mockState)
        await new Promise((r) => setTimeout(r, 10))

        expect(stalenessReceipt).toBeDefined()
        expect(stalenessReceipt.isDirty).toBe(false)
    })

    it('delegates Act.HashTtsGenerationPayload and Act.VerifyPayloadHashParity', async () => {
        const model = new PayloadModel()
        let hashReceipt: any

        const hashAction = new Act.HashTtsGenerationPayload({
            idx: 'test-hash',
            dat: { hashPayload: validRequestPayload, epoch: 3 },
            slv: (res) => {
                hashReceipt = res.pldBit.dat
            },
        })

        reducer(model, hashAction, mockState)
        await new Promise((r) => setTimeout(r, 10))

        expect(hashReceipt).toBeDefined()
        expect(hashReceipt.payloadSha256).toMatch(/^[0-9a-f]{64}$/)

        let parityResult: any
        const parityAction = new Act.VerifyPayloadHashParity({
            idx: 'test-parity',
            dat: {
                parityInput: {
                    expectedHash: hashReceipt.payloadSha256,
                    payload: validRequestPayload,
                    epoch: 4,
                },
            },
            slv: (res) => {
                parityResult = res.pldBit.dat
            },
        })

        reducer(model, parityAction, mockState)
        await new Promise((r) => setTimeout(r, 10))

        expect(parityResult).toBeDefined()
        expect(parityResult.isValid).toBe(true)
    })

    it('returns unchanged model for unhandled actions', () => {
        const model = new PayloadModel()
        const result = reducer(
            model,
            { type: '[Unrecognized action]' } as any,
            mockState,
        )
        expect(result).toBe(model)
    })
})
