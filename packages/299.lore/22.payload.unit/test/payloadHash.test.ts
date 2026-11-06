import { describe, it, expect } from 'vitest'
import {
    canonicalizeJson,
    sha256Hex,
    hashTtsGenerationRequest,
    verifyPayloadHashParity,
    assertPayloadHashParity,
} from '../buz/canonicalPayloadHasher.buzz.js'
import { PayloadModel } from '../payload.model.js'
import {
    initPayload,
    hashTtsGenerationPayload,
    verifyPayloadHashParity as verifyParityBuzzer,
} from '../payload.buzzer.js'
import type { TTSGenerationRequest } from '../val/ttsPayload.val.js'

describe('22.payload.unit :: Task 6.4 Deterministic RFC 8785 Payload Hasher', () => {
    const baseRequest: TTSGenerationRequest = {
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

    it('guarantees key ordering invariance under RFC 8785 canonicalization', () => {
        // Invert top-level dictionary keys
        const invertedRequest = {
            pinnedFactVersions: {
                fact_boiler_pressure_gauge: 1,
                fact_wart_arm_severed: 3,
            },
            verbatimText: 'Keep the tallow dry until the pump restarts.',
            silenceDirective: baseRequest.silenceDirective,
            somaticMask: baseRequest.somaticMask,
            composedDspMatrix: baseRequest.composedDspMatrix,
            conditioningStrategy: 'ZERO_SHOT_WAV',
            characterId: 'char_wart',
            lineId: 'line_wart_001',
            sceneId: 'sc_culvert_siphon_01',
            seriesSlug: 'under-the-floorboards',
        }

        const c1 = canonicalizeJson(baseRequest)
        const c2 = canonicalizeJson(invertedRequest)

        expect(c1).toBe(c2)
        expect(sha256Hex(c1)).toBe(sha256Hex(c2))
    })

    it('enforces Unicode Normalization Form C (NFC) equivalence', () => {
        const precomposed = 'Caf\u00E9 valve'
        const decomposed = 'Cafe\u0301 valve'

        expect(canonicalizeJson(precomposed)).toBe(canonicalizeJson(decomposed))
        expect(sha256Hex(canonicalizeJson(precomposed))).toBe(
            sha256Hex(canonicalizeJson(decomposed)),
        )
    })

    it('throws fatal TypeError on non-finite IEEE 754 numbers (NaN, Infinity)', () => {
        expect(() => canonicalizeJson({ invalidNum: NaN })).toThrowError(
            '[CANONICAL_JSON] Non-finite IEEE-754 numbers are strictly forbidden.',
        )
        expect(() => canonicalizeJson({ invalidNum: Infinity })).toThrowError(
            '[CANONICAL_JSON] Non-finite IEEE-754 numbers are strictly forbidden.',
        )
    })

    it('hashes a compliant TTSGenerationRequest and yields a frozen receipt', () => {
        const receipt = hashTtsGenerationRequest(baseRequest, 100)

        expect(receipt.lineId).toBe('line_wart_001')
        expect(receipt.characterId).toBe('char_wart')
        expect(receipt.payloadSha256).toMatch(/^[0-9a-f]{64}$/)
        expect(receipt.byteLength).toBeGreaterThan(0)
        expect(receipt.isBitIdentical).toBe(true)
        expect(Object.isFrozen(receipt)).toBe(true)
    })

    it('verifies payload hash parity and fails closed on divergent hashes', () => {
        const receipt = hashTtsGenerationRequest(baseRequest, 1)
        const validParity = verifyPayloadHashParity(
            receipt.payloadSha256,
            baseRequest,
            1,
        )

        expect(validParity.isValid).toBe(true)
        expect(validParity.lineId).toBe('line_wart_001')
        expect(validParity.errorCode).toBeUndefined()

        // Mismatched expected hash
        const fakeHash = '0'.repeat(64)
        const mismatchParity = verifyPayloadHashParity(fakeHash, baseRequest, 2)

        expect(mismatchParity.isValid).toBe(false)
        expect(mismatchParity.errorCode).toBe('PAYLOAD_HASH_PARITY_MISMATCH')

        expect(() =>
            assertPayloadHashParity(fakeHash, baseRequest, 2),
        ).toThrowError(/PAYLOAD_HASH_PARITY_BREACH/)
    })

    it('executes payload hashing buzzer through PayloadModel flow', async () => {
        const model = new PayloadModel()
        initPayload(model, { idx: 'init' }, {} as any)

        let emittedReceipt: any
        await hashTtsGenerationPayload(
            model,
            {
                idx: 'hash-test',
                dat: { payload: baseRequest, epoch: 10 },
                slv: (res) => {
                    emittedReceipt = res.pldBit?.dat
                },
            },
            { hunt: async () => {} } as any,
        )

        expect(emittedReceipt).toBeDefined()
        expect(emittedReceipt.payloadSha256).toMatch(/^[0-9a-f]{64}$/)
        expect(model.hashedPayloads['line_wart_001']).toBeDefined()

        let parityResult: any
        await verifyParityBuzzer(
            model,
            {
                idx: 'parity-test',
                dat: {
                    expectedHash: emittedReceipt.payloadSha256,
                    payload: baseRequest,
                    epoch: 10,
                },
                slv: (res) => {
                    parityResult = res.pldBit?.dat
                },
            },
            { hunt: async () => {} } as any,
        )

        expect(parityResult).toBeDefined()
        expect(parityResult.isValid).toBe(true)
        expect(model.parityReceipts['line_wart_001']).toBeDefined()
    })
})
