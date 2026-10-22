import { describe, it, expect } from 'vitest'
import {
    EpochIntegerSchema,
    FactEpochTriadSchema,
    MAX_SAFE_EPOCH_INTEGER,
} from '../val/epoch.val.js'
import { EpochGateBuzz } from '../buz/epoch.buzz.js'

describe('06.facts.unit :: Deterministic Epoch Integer Enforcer', () => {
    describe('Positive Controls (Valid Epoch Integers & Defaults)', () => {
        it('accepts zero as a valid baseline epoch', () => {
            expect(EpochIntegerSchema.parse(0)).toBe(0)
            const res = EpochGateBuzz.validateEpoch(0)
            expect(res.isValid).toBe(true)
            expect(EpochGateBuzz.isEpochIntegerFast(0)).toBe(true)
            expect(() => EpochGateBuzz.assertEpochInteger(0)).not.toThrow()
        })

        it('accepts positive safe integers', () => {
            const testCases = [1, 42, 1000, 1729600000, MAX_SAFE_EPOCH_INTEGER]
            for (const val of testCases) {
                expect(EpochIntegerSchema.parse(val)).toBe(val)
                const res = EpochGateBuzz.validateEpoch(val)
                expect(res.isValid).toBe(true)
                expect(EpochGateBuzz.isEpochIntegerFast(val)).toBe(true)
                expect(() =>
                    EpochGateBuzz.assertEpochInteger(val),
                ).not.toThrow()
            }
        })

        it('defaults epoch fields to zero when omitted in FactEpochTriadSchema', () => {
            const parsed = FactEpochTriadSchema.parse({})
            expect(parsed.created_at_epoch).toBe(0)
            expect(parsed.last_mutated_epoch).toBe(0)
            expect(parsed.last_reconsidered_epoch).toBe(0)
        })

        it('validates a causally consistent epoch triad', () => {
            const triad = {
                created_at_epoch: 100,
                last_mutated_epoch: 150,
                last_reconsidered_epoch: 200,
            }
            const res = EpochGateBuzz.validateEpochTriad(triad)
            expect(res.createdAtEpoch).toBe(100)
            expect(res.lastMutatedEpoch).toBe(150)
            expect(res.lastReconsideredEpoch).toBe(200)
        })
    })

    describe('Negative Controls (Adversarial & Malformed Inputs Fail Closed)', () => {
        it('rejects floating-point numbers with FLOAT_PROHIBITED', () => {
            const floatCases = [1729600000.55, 0.1, 42.000001, -0.5]
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

        it('rejects un-schemaed keys on FactEpochTriadSchema (.strict() gate)', () => {
            const contaminated = {
                created_at_epoch: 10,
                last_mutated_epoch: 10,
                last_reconsidered_epoch: 10,
                hallucinated_timestamp: 1729600000, // Illegal un-schemaed property
            }
            expect(() => FactEpochTriadSchema.parse(contaminated)).toThrow(
                /unrecognized_keys/,
            )
        })
    })
})
