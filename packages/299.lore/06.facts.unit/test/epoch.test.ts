import { describe, it, expect } from 'vitest'
import { EpochGateBuzz } from '../buz/epoch.buzz.js'
import {
    EpochIntegerSchema,
    FactEpochTriadSchema,
    isNonNegativeSafeInteger,
} from '../val/epoch.val.js'

describe('06.facts.unit :: Deterministic Epoch Integer Enforcer', () => {
    describe('Positive Controls (Integer Timestamps & Defaults)', () => {
        const validIntegers = [
            0,
            1,
            42,
            1000,
            1729600000,
            Number.MAX_SAFE_INTEGER,
        ]

        it.each(validIntegers)(
            'accepts valid non-negative safe integer: %d',
            (epoch) => {
                expect(() => EpochIntegerSchema.parse(epoch)).not.toThrow()
                const res = EpochGateBuzz.validateEpoch(epoch)
                expect(res.isValid).toBe(true)
                if (res.isValid) {
                    expect(res.value).toBe(epoch)
                    expect(res.isSafeInteger).toBe(true)
                    expect(res.isNonNegative).toBe(true)
                }
                expect(() =>
                    EpochGateBuzz.assertEpochInteger(epoch),
                ).not.toThrow()
                expect(EpochGateBuzz.isEpochIntegerFast(epoch)).toBe(true)
                expect(isNonNegativeSafeInteger(epoch)).toBe(true)
            },
        )

        it('resolves deterministic defaults to 0 without ambient Date.now() drift', () => {
            const parsed = FactEpochTriadSchema.parse({})
            expect(parsed.created_at_epoch).toBe(0)
            expect(parsed.last_mutated_epoch).toBe(0)
            expect(parsed.last_reconsidered_epoch).toBe(0)
        })

        it('validates and preserves valid monotonic epoch triads', () => {
            const triad = {
                created_at_epoch: 100,
                last_mutated_epoch: 250,
                last_reconsidered_epoch: 200,
            }
            const validated = EpochGateBuzz.validateEpochTriad(triad)
            expect(validated.createdAtEpoch).toBe(100)
            expect(validated.lastMutatedEpoch).toBe(250)
            expect(validated.lastReconsideredEpoch).toBe(200)
        })
    })

    describe('Negative Controls (Floating-Point, Ambient Drift & Sequence Violations)', () => {
        it('rejects floating-point timestamps with FLOAT_PROHIBITED', () => {
            const floatCases = [1729600000.55, 0.1, 42.000001, Math.PI]
            for (const val of floatCases) {
                expect(() => EpochIntegerSchema.parse(val)).toThrow(
                    /exact integer/,
                )
                const res = EpochGateBuzz.validateEpoch(val)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('FLOAT_PROHIBITED')
                }
                expect(EpochGateBuzz.isEpochIntegerFast(val)).toBe(false)
                expect(() => EpochGateBuzz.assertEpochInteger(val)).toThrow(
                    /EPOCH_INTEGER_BREACH/,
                )
            }
        })

        it('rejects negative integers with NEGATIVE_INTEGER_PROHIBITED', () => {
            const negativeCases = [-1, -42, -99999]
            for (const val of negativeCases) {
                expect(() => EpochIntegerSchema.parse(val)).toThrow(
                    /non-negative/,
                )
                const res = EpochGateBuzz.validateEpoch(val)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('NEGATIVE_INTEGER_PROHIBITED')
                }
                expect(EpochGateBuzz.isEpochIntegerFast(val)).toBe(false)
            }
        })

        it('rejects non-finite values (NaN and Infinity)', () => {
            const nonFiniteCases = [NaN, Infinity, -Infinity]
            for (const val of nonFiniteCases) {
                expect(() => EpochIntegerSchema.parse(val)).toThrow()
                const res = EpochGateBuzz.validateEpoch(val)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('FLOAT_PROHIBITED')
                }
                expect(EpochGateBuzz.isEpochIntegerFast(val)).toBe(false)
            }
        })

        it('rejects unsafe integer overflow (> Number.MAX_SAFE_INTEGER)', () => {
            const unsafe = Number.MAX_SAFE_INTEGER + 1000
            expect(() => EpochIntegerSchema.parse(unsafe)).toThrow()
            const res = EpochGateBuzz.validateEpoch(unsafe)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('UNSAFE_INTEGER_OVERFLOW')
            }
        })

        it('rejects non-numeric primitives', () => {
            const cases = ['0', '100', null, undefined, true, {}, []]
            for (const c of cases) {
                expect(() => EpochIntegerSchema.parse(c)).toThrow()
                const res = EpochGateBuzz.validateEpoch(c)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('INVALID_TYPE')
                }
                expect(EpochGateBuzz.isEpochIntegerFast(c)).toBe(false)
            }
        })

        it('rejects temporal sequence inversions (created_at_epoch > last_mutated_epoch)', () => {
            const invertedTriad = {
                created_at_epoch: 200,
                last_mutated_epoch: 100, // Regression: mutated prior to creation
                last_reconsidered_epoch: 200,
            }
            expect(() => FactEpochTriadSchema.parse(invertedTriad)).toThrow(
                /created_at_epoch must be <= last_mutated_epoch/,
            )
            expect(() =>
                EpochGateBuzz.validateEpochTriad(invertedTriad),
            ).toThrow(/EPOCH_TRIAD_BREACH/)
        })

        it('rejects extraneous properties injected into epoch triad', () => {
            const dirtyTriad = {
                created_at_epoch: 100,
                last_mutated_epoch: 100,
                last_reconsidered_epoch: 100,
                ambient_wall_clock_ms: Date.now(), // Contaminant
            }
            expect(() => FactEpochTriadSchema.parse(dirtyTriad)).toThrow(
                /unrecognized_keys/,
            )
        })
    })
})
