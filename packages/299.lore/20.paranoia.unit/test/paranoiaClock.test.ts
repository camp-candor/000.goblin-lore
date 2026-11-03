import { describe, it, expect } from 'vitest'
import {
    calculateAcousticImpulseStep,
    decayParanoiaClock,
} from '../buz/acousticImpulse.buzz.js'
import { calculatePitchFlutterProfile } from '../buz/pitchFlutter.buzz.js'
import {
    assertIntegerMetric,
    clampBps,
    type ParanoiaMeterState,
    type AcousticTransientEvent,
} from '../val/paranoiaClock.val.js'
import { ParanoiaModel } from '../paranoia.model.js'
import {
    initParanoia,
    applyAcousticTransientImpulse,
    decayParanoiaTick,
    computeParanoiaPitchFlutter,
} from '../paranoia.buzzer.js'

describe('20.paranoia.unit :: Acoustic Paranoia Clock Coupling', () => {
    const baseClock: ParanoiaMeterState = {
        clockId: 'clk_bog_paranoia',
        entityId: 'char_bog',
        clockName: 'Bog Epistemic Watch',
        currentBps: 2400,
        baselineBps: 2400,
        maxCeilingBps: 10000,
        decayRatePerTick: 300,
        acousticCouplingCoeff: 5000,
        thresholdLimitBps: 8000,
        ambientDarknessLock: false,
        isTriggered: false,
        updatedAtEpoch: 0,
    }

    const highStressAcousticEvent: AcousticTransientEvent = {
        eventId: 'evt_boiler_groan_01',
        sourceIntensityCdB: 11000, // 110.0 dB pipe groan
        partitionTransmissionLossCdB: 2500, // 25.0 dB wall loss
        ambientNoiseFloorCdB: 1500, // 15.0 dB floor
        auditoryDebuffCdB: 0,
        snrMinCdB: 600,
        soundDescription: 'Heavy iron steam pipe hydraulic groan',
    }

    it('asserts integer metric invariants and prohibits floating-point numbers', () => {
        expect(() => assertIntegerMetric(2400, 'currentBps')).not.toThrow()
        expect(() => assertIntegerMetric(2400.5, 'currentBps')).toThrowError(
            '[FLOAT_PROHIBITED]',
        )
        expect(() => assertIntegerMetric(NaN, 'currentBps')).toThrowError(
            '[FLOAT_PROHIBITED]',
        )
    })

    it('calculates acoustic attenuation and transfers stress into paranoia basis points', () => {
        // Arrival: 11000 - 2500 = 8500 cdB (85 dB)
        // SNR: 8500 - 1500 = 7000 cdB (70 dB > 600 cdB snrMin)
        // Stress transfer: floor((7000 * 5000) / 1000) = 3500 bps
        // Next: (2400 - 300) + 3500 = 5600 bps
        const receipt = calculateAcousticImpulseStep(
            baseClock,
            highStressAcousticEvent,
            1,
        )

        expect(receipt.isAudible).toBe(true)
        expect(receipt.arrivalIntensityCdB).toBe(8500)
        expect(receipt.effectiveSnrCdB).toBe(7000)
        expect(receipt.impulseAppliedBps).toBe(3500)
        expect(receipt.nextBps).toBe(5600)
        expect(receipt.isTriggered).toBe(false) // 5600 < 8000
        expect(Object.isFrozen(receipt)).toBe(true)
    })

    it('trips boil-over trigger when acoustic stress pushes clock >= threshold', () => {
        const elevatedClock = { ...baseClock, currentBps: 6500 }
        const receipt = calculateAcousticImpulseStep(
            elevatedClock,
            highStressAcousticEvent,
            2,
        )

        // (6500 - 300) + 3500 = 9700 bps >= 8000 bps
        expect(receipt.nextBps).toBe(9700)
        expect(receipt.isTriggered).toBe(true)
    })

    it('drops sub-threshold acoustic transients without transferring stress', () => {
        const faintEvent: AcousticTransientEvent = {
            eventId: 'evt_faint_scuff',
            sourceIntensityCdB: 2500, // 25.0 dB
            partitionTransmissionLossCdB: 2000, // 20.0 dB
            ambientNoiseFloorCdB: 1500, // 15.0 dB floor
            auditoryDebuffCdB: 0,
            snrMinCdB: 600, // Needs arrival >= 2100 cdB
            soundDescription: 'Distant rat scratch',
        }
        // Arrival: 2500 - 2000 = 500 cdB. Effective SNR: 500 - 1500 = -1000 cdB < 600 cdB
        const receipt = calculateAcousticImpulseStep(baseClock, faintEvent, 3)

        expect(receipt.isAudible).toBe(false)
        expect(receipt.impulseAppliedBps).toBe(0)
        expect(receipt.nextBps).toBe(2400) // Decayed to baseline floor 2400
    })

    it('enforces passive decay resistance when ambient darkness lock is engaged', () => {
        const darkClock: ParanoiaMeterState = {
            ...baseClock,
            currentBps: 7000,
            ambientDarknessLock: true,
        }

        const receipt = decayParanoiaClock(darkClock, 4)
        // Darkness lock freezes passive decay: 7000 bps remains 7000 bps
        expect(receipt.nextBps).toBe(7000)

        const illuminatedClock: ParanoiaMeterState = {
            ...baseClock,
            currentBps: 7000,
            ambientDarknessLock: false,
        }
        const decayedReceipt = decayParanoiaClock(illuminatedClock, 4)
        expect(decayedReceipt.nextBps).toBe(6700) // 7000 - 300
    })

    it('computes subharmonic pitch flutter and narrows vision cone during hypervigilance', () => {
        // Normal state
        const normalFlutter = calculatePitchFlutterProfile(baseClock)
        expect(normalFlutter.isHypervigilant).toBe(false)
        expect(normalFlutter.visionConeDegrees).toBe(120)

        // Hypervigilant state (8500 bps)
        const tenseClock = { ...baseClock, currentBps: 8500 }
        const tenseFlutter = calculatePitchFlutterProfile(tenseClock)

        expect(tenseFlutter.isHypervigilant).toBe(true)
        expect(tenseFlutter.visionConeDegrees).toBe(45) // Tunnel vision
        expect(tenseFlutter.flutterDepthCentitones).toBe(212) // (250 * 8500) / 10000
        expect(tenseFlutter.subharmonicFlutterHzBps).toBe(69750) // 40000 + (35000 * 8500) / 10000
    })

    it('executes end-to-end impulse buzzer cycle through ParanoiaModel', async () => {
        const model = new ParanoiaModel()
        initParanoia(model, { idx: 'init' }, {} as any)

        let emittedReceipt: any
        await applyAcousticTransientImpulse(
            model,
            {
                idx: 'impulse-test',
                dat: {
                    clock: baseClock,
                    acousticEvent: highStressAcousticEvent,
                    epoch: 10,
                },
                slv: (res) => {
                    emittedReceipt = res.parBit.dat
                },
            },
            { hunt: async () => {} } as any,
        )

        expect(emittedReceipt).toBeDefined()
        expect(emittedReceipt.nextBps).toBe(5600)
        expect(model.clocksByEntity['char_bog']).toBeDefined()
        expect(model.lastReceipts['char_bog']).toBeDefined()

        let flutterReceipt: any
        computeParanoiaPitchFlutter(
            model,
            {
                idx: 'flutter-test',
                dat: { clock: model.clocksByEntity['char_bog'] },
                slv: (res) => {
                    flutterReceipt = res.parBit.dat
                },
            },
            {} as any,
        )

        expect(flutterReceipt).toBeDefined()
        expect(flutterReceipt.isHypervigilant).toBe(true)
        expect(model.flutterProfiles['char_bog']).toBeDefined()
    })
})
