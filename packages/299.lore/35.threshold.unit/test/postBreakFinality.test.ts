import { describe, it, expect } from 'vitest'
import {
    assertIntegerMetric,
    type ThresholdEvaluationInput,
} from '../val/postBreak.val.js'
import { evaluateThresholdBreachInterception } from '../buz/postBreakInterceptor.buzz.js'
import { executeAttenuationFenceLift } from '../buz/liftAttenuationFence.buzz.js'
import { sealPermanentAcousticProfile } from '../buz/sealPermanentAcousticDelta.buzz.js'
import { ThresholdModel } from '../threshold.model.js'
import {
    initThreshold,
    evaluatePostBreakThreshold,
} from '../threshold.buzzer.js'

describe('35.threshold.unit :: Post-Break Irreversible Finality Engine', () => {
    const sampleInput: ThresholdEvaluationInput = {
        meterId: 'mtr_spleen_refusal',
        entityId: 'char_spleen',
        category: 'REFUSAL_STRAIN',
        currentValueBp: 10000,
        thresholdLimitBp: 8000,
        mutationDirective: {
            entityId: 'char_spleen',
            targetRefusalVectorId: 'ref_never_admit_gauge_blindness',
            newBehaviorDirective:
                'Admits total inability to read boiler dials; begs for assistance.',
            bannedTokensRemoved: [
                'boiler_dial',
                'pressure_blindness',
                'steam_gauge',
            ],
            terminalConditionAdded: 'SUBSERVIENT',
            permanentAcousticDeltas: {
                basePitchShiftCentitones: -150,
                formantWarpingBps: 8500,
                vocalFryDensityBps: 3000,
                breathinessPauseMultiplierBps: 12000,
                bannedCadencesRemoved: ['RAPID_STACCATO'],
            },
            climaxSceneDirective:
                'SCENE_CLIMAX_MANDATORY: Spleen confesses fraud directly to Mum Grissel.',
        },
        tick: 104,
    }

    it('asserts integer metric invariants and prohibits floating-point numbers', () => {
        expect(() =>
            assertIntegerMetric(8000, 'thresholdLimitBp'),
        ).not.toThrow()
        expect(() =>
            assertIntegerMetric(8000.5, 'thresholdLimitBp'),
        ).toThrowError('[FLOAT_PROHIBITED]')
        expect(() =>
            assertIntegerMetric('8000', 'thresholdLimitBp'),
        ).toThrowError('[FLOAT_PROHIBITED]')
    })

    it('ignores sub-threshold values without generating receipts or halting cycles', () => {
        const unbreachedInput: ThresholdEvaluationInput = {
            ...sampleInput,
            currentValueBp: 7500,
        }
        const result = evaluateThresholdBreachInterception(unbreachedInput)
        expect(result.isBreached).toBe(false)
        expect(result.receipt).toBeNull()
    })

    it('intercepts threshold breach and executes the 5-step Post-Break Atomic Sequence', () => {
        const activeAcousticProfile = {
            pitchShiftCentitones: 0,
            formantWarpingBps: 10000,
            vocalFryDensityBps: 1000,
            breathinessPauseMultiplierBps: 10000,
            bannedCadences: [
                'RAPID_STACCATO',
                'RISING_INFLECTION_INTERROGATIVE',
            ],
        }
        const currentTokens = [
            'boiler_dial',
            'pressure_blindness',
            'grease',
            'culvert',
        ]

        const { isBreached, receipt } = evaluateThresholdBreachInterception(
            sampleInput,
            activeAcousticProfile,
            currentTokens,
        )

        expect(isBreached).toBe(true)
        expect(receipt).not.toBeNull()
        // Step 1: Mandatory execution halt
        expect(receipt!.isHaltRequired).toBe(true)
        // Step 2: Value preserved without resetting to zero
        expect(receipt!.breachedValueBp).toBe(10000)
        // Step 3: Target refusal vector recorded
        expect(receipt!.targetRefusalVectorId).toBe(
            'ref_never_admit_gauge_blindness',
        )
        expect(receipt!.terminalConditionAdded).toBe('SUBSERVIENT')
        // Step 4: Verbal attenuation fences lifted
        expect(receipt!.bannedTokensRemoved).toEqual([
            'boiler_dial',
            'pressure_blindness',
        ])
        // Step 4b: Permanent baseline acoustic modifications applied
        expect(receipt!.updatedAcousticProfile.pitchShiftCentitones).toBe(-150)
        expect(receipt!.updatedAcousticProfile.formantWarpingBps).toBe(8500)
        expect(receipt!.updatedAcousticProfile.vocalFryDensityBps).toBe(4000) // 1000 + 3000
        expect(receipt!.updatedAcousticProfile.remainingBannedCadences).toEqual(
            ['RISING_INFLECTION_INTERROGATIVE'],
        )
        // Step 5: Climax scene directive emitted
        expect(receipt!.climaxSceneDirective).toContain(
            'SCENE_CLIMAX_MANDATORY',
        )
        expect(Object.isFrozen(receipt)).toBe(true)
    })

    it('correctly lifts verbal attenuation tokens without mutating unrelated taboo lemmas', () => {
        const existing = [
            'culvert_key',
            'stolen_oil',
            'gauge_blindness',
            'boiler_flue',
        ]
        const toRemove = ['stolen_oil', 'gauge_blindness']

        const result = executeAttenuationFenceLift(
            'char_spleen',
            existing,
            toRemove,
        )
        expect(result.tokensRemoved).toEqual(['gauge_blindness', 'stolen_oil'])
        expect(result.remainingTokens).toEqual(['boiler_flue', 'culvert_key'])
        expect(result.isBreakStateAuthorized).toBe(true)
        expect(Object.isFrozen(result)).toBe(true)
    })

    it('permanently seals acoustic modifications and unbans cadences', () => {
        const baseProfile = {
            pitchShiftCentitones: -100,
            formantWarpingBps: 10000,
            vocalFryDensityBps: 2000,
            breathinessPauseMultiplierBps: 10000,
            bannedCadences: ['RAPID_STACCATO', 'CHEERFUL_MODULATION'],
        }
        const deltas = {
            basePitchShiftCentitones: -200,
            formantWarpingBps: 9000,
            vocalFryDensityBps: 3500,
            breathinessPauseMultiplierBps: 11000,
            bannedCadencesRemoved: ['RAPID_STACCATO'],
        }

        const sealed = sealPermanentAcousticProfile(baseProfile, deltas)
        expect(sealed.pitchShiftCentitones).toBe(-300)
        expect(sealed.formantWarpingBps).toBe(9000)
        expect(sealed.vocalFryDensityBps).toBe(5500)
        expect(sealed.remainingBannedCadences).toEqual(['CHEERFUL_MODULATION'])
        expect(Object.isFrozen(sealed)).toBe(true)
    })

    it('executes full evaluation buzzer cycle through ThresholdModel', async () => {
        const model = new ThresholdModel()
        initThreshold(model, { idx: 'init' }, {} as any)

        let emittedReceipt: any
        await evaluatePostBreakThreshold(
            model,
            {
                idx: 'break-test',
                dat: {
                    input: sampleInput,
                    currentAttenuationTokens: ['boiler_dial', 'grease'],
                },
                slv: (res) => {
                    emittedReceipt = res.trhBit.dat
                },
            },
            { hunt: async () => {} } as any,
        )

        expect(emittedReceipt).toBeDefined()
        expect(emittedReceipt.entityId).toBe('char_spleen')
        expect(emittedReceipt.isHaltRequired).toBe(true)
        expect(model.breakReceipts['char_spleen']).toBeDefined()
        expect(model.brokenEntities.has('char_spleen')).toBe(true)
    })
})
