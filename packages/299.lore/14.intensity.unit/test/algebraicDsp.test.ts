import { describe, it, expect } from 'vitest'
import {
    assertIntegerMetric,
    divRoundHalfEven,
    clamp,
} from '../val/algebraicDsp.val.js'
import { composePitchFormantVelocity } from '../buz/pitchFormantComposer.buzz.js'
import { calculateBreathPauseDilation } from '../buz/breathDilation.buzz.js'
import { composeVocalFryVisceralHold } from '../buz/vocalFryComposer.buzz.js'
import { assertMotorCollapseFeasibility } from '../buz/motorCollapseGate.buzz.js'
import { IntensityModel } from '../intensity.model.js'
import {
    initIntensity,
    composeAlgebraicDspMatrix,
} from '../intensity.buzzer.js'
import type { VocalDspModifierProfile } from '../../37.trauma.unit/val/vocalDsp.val.js'

describe('14.intensity.unit :: Dynamic Algebraic DSP Composition Engine', () => {
    const neutralBaseline: VocalDspModifierProfile = {
        entityId: 'char_wart',
        pitchShiftCentitones: 0,
        formantWarpingBps: 10000,
        speedMultiplierBps: 10000,
        breathinessPauseMultiplierBps: 10000,
        vocalFryDensityBps: 0,
        hasLaryngealTrauma: false,
        hasPulmonaryTrauma: false,
        bannedCadences: [],
        matchedAcousticConditions: [],
    }

    it('asserts integer metric invariants and prohibits floating-point numbers', () => {
        expect(() => assertIntegerMetric(10000, 'speed')).not.toThrow()
        expect(() => assertIntegerMetric(10000.5, 'speed')).toThrowError(
            '[FLOAT_PROHIBITED]',
        )
        expect(() => assertIntegerMetric(NaN, 'speed')).toThrowError(
            '[FLOAT_PROHIBITED]',
        )
    })

    it("calculates deterministic Banker's Rounding (divRoundHalfEven) correctly", () => {
        expect(divRoundHalfEven(10000, 10000)).toBe(1)
        expect(divRoundHalfEven(15, 10)).toBe(2) // 1.5 rounds to nearest even integer 2
        expect(divRoundHalfEven(25, 10)).toBe(2) // 2.5 rounds to nearest even integer 2
        expect(divRoundHalfEven(35, 10)).toBe(4) // 3.5 rounds to nearest even integer 4
        expect(divRoundHalfEven(14, 10)).toBe(1) // 1.4 rounds down to 1
        expect(divRoundHalfEven(16, 10)).toBe(2) // 1.6 rounds up to 2
    })

    it('composes pitch, formant, and velocity with unexhausted and exhausted fatigue', () => {
        // Normal baseline (0 fatigue)
        const normal = composePitchFormantVelocity(
            0,
            -200,
            10000,
            9000,
            10000,
            0,
        )
        expect(normal.effectivePitchCentitones).toBe(-200)
        expect(normal.effectiveFormantWarpingBps).toBe(9000)
        expect(normal.effectiveTonePacingBps).toBe(10000)

        // High fatigue (8,200 bps): velocity reduces by 0.30 * 0.82 = 24.6% -> 7,540 bps
        const exhausted = composePitchFormantVelocity(
            0,
            0,
            10000,
            10000,
            10000,
            8200,
        )
        // fatigueReduction = divRoundHalfEven(3000 * 8200, 10000) = divRoundHalfEven(24600000, 10000) = 2460
        // velocityFactor = 10000 - 2460 = 7540 bps
        expect(exhausted.effectiveTonePacingBps).toBe(7540)
    })

    it('calculates quadratic respiratory pause dilation for The Pilot case (8,200 bps fatigue)', () => {
        const result = calculateBreathPauseDilation(10000, 8200)
        // S = 8200; S^2 = 67,240,000
        // Term = divRoundHalfEven(14000 * 67240000, 100000000) = divRoundHalfEven(941360000000, 100000000) = 9414
        // breathFactor = 10000 + 9414 = 19414 bps (~1.94x base dilation)
        expect(result.effectiveBreathinessPauseBps).toBe(19414)
        // Because 8200 > 8000 bps, pause_frequency_multiplier is locked to 2.8x (28,000 bps)
        expect(result.pauseFrequencyMultiplierBps).toBe(28000)
        expect(result.estimatedDurationExpansionBps).toBe(4000)
        expect(result.isExhaustionStrained).toBe(true)
    })

    it('calculates glottal fry density and injects 18-frame visceral reflex hold upon severe pain', () => {
        // High fatigue (8200 bps) and pain (7500 bps)
        const result = composeVocalFryVisceralHold(0, 0, 8200, 7500)
        // Fatigue contribution: (5000 * 8200)/10000 = 4100
        // Pain contribution: (4000 * 7500)/10000 = 3000
        // Raw sum = 7100, but fatigue > 8000 enforces minimum floor of 8500 bps
        expect(result.effectiveVocalFryDensityBps).toBe(8500)
        // Pain >= 7000 bps mandates 18 frames visceral reflex hold
        expect(result.visceralReflexHoldFrames).toBe(18)
    })

    it('fails closed immediately at T0 = $0.00 when high fatigue motor collapse is violated', () => {
        expect(() =>
            assertMotorCollapseFeasibility(8200, ['SPEAK', 'LOOK_AROUND']),
        ).not.toThrow()

        expect(() =>
            assertMotorCollapseFeasibility(8200, ['RUN']),
        ).toThrowError('CANON_BREACH: Motor collapse')

        expect(() =>
            assertMotorCollapseFeasibility(8500, ['sprint_away']),
        ).toThrowError('CANON_BREACH: Motor collapse')
    })

    it('executes full composition buzzer cycle through IntensityModel', async () => {
        const model = new IntensityModel()
        initIntensity(model, { idx: 'init' }, {} as any)

        let emittedReceipt: any
        composeAlgebraicDspMatrix(
            model,
            {
                idx: 'compose-test',
                dat: {
                    entityId: 'char_wart',
                    baselineProfile: neutralBaseline,
                    sceneDeltas: {
                        deltaPitchCentitones: -300,
                        deltaFormantBps: 8000,
                        deltaFryBps: 1000,
                    },
                    meters: {
                        somaticFatigueBps: 8200,
                        physicalPainBps: 7500,
                        paranoiaPressureBps: 2000,
                    },
                    proposedMotorActions: ['CRAWL', 'GASP'],
                },
                slv: (res) => {
                    emittedReceipt = res.intBit.dat
                },
            },
            { hunt: async () => {} } as any,
        )

        expect(emittedReceipt).toBeDefined()
        expect(emittedReceipt.entityId).toBe('char_wart')
        expect(emittedReceipt.effectivePitchCentitones).toBe(-300)
        expect(emittedReceipt.effectiveFormantWarpingBps).toBe(8000)
        expect(emittedReceipt.effectiveVocalFryDensityBps).toBe(8500)
        expect(emittedReceipt.visceralReflexHoldFrames).toBe(18)
        expect(emittedReceipt.pauseFrequencyMultiplierBps).toBe(28000)
        expect(model.composedMatrices['char_wart']).toBeDefined()
    })
})
