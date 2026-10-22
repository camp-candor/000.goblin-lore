import { describe, it, expect } from 'vitest'
import { FactNodeSchema, FACT_NODE_PERMITTED_KEYS } from '../schema.model.js'
import { ClosureGateBuzz } from '../buz/closure.buzz.js'

describe('26.schema.unit :: Un-Schemaed Key Closure Enforcer', () => {
    const validBaseFact = {
        id: 'fact_bog_shoulder',
        claim_text: 'Bog right shoulder is dislocated.',
        scope: 'CHARACTER',
        authority_level: 'CANON',
        standing: 'ACTIVE_ENDORSED',
        version: 1,
        content_hash:
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        author: 'lead_writer',
        created_at_epoch: 100,
        last_mutated_epoch: 100,
        last_reconsidered_epoch: 100,
    }

    describe('Positive Controls (Strict 11-Field Contracts)', () => {
        it('accepts valid 11-field fact node records', () => {
            const parsed = FactNodeSchema.parse(validBaseFact)
            expect(parsed.id).toBe('fact_bog_shoulder')
            expect(parsed.version).toBe(1)

            const res = ClosureGateBuzz.validateFactClosure(validBaseFact)
            expect(res.isValid).toBe(true)
            if (res.isValid) {
                expect(res.propertyCount).toBe(11)
                expect(res.data.id).toBe('fact_bog_shoulder')
            }
            expect(() =>
                ClosureGateBuzz.assertFactClosure(validBaseFact),
            ).not.toThrow()
        })

        it('populates default values cleanly when optional fields are omitted', () => {
            const minimalFact = {
                id: 'fact_valve_closed',
                claim_text: 'Valve 04 in culvert is seized shut.',
                scope: 'LOCATION',
                content_hash:
                    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                author: 'architect',
            }

            const parsed = FactNodeSchema.parse(minimalFact)
            expect(parsed.authority_level).toBe('CANON')
            expect(parsed.standing).toBe('ACTIVE_ENDORSED')
            expect(parsed.version).toBe(1)
            expect(parsed.created_at_epoch).toBe(0)
            expect(parsed.last_mutated_epoch).toBe(0)
            expect(parsed.last_reconsidered_epoch).toBe(0)

            const res = ClosureGateBuzz.validateFactClosure(parsed)
            expect(res.isValid).toBe(true)
        })

        it('deep-freezes validated nodes preventing runtime mutations', () => {
            const sealed = ClosureGateBuzz.sealFactNode(validBaseFact as any)
            expect(Object.isFrozen(sealed)).toBe(true)
            expect(() => {
                // @ts-expect-error verifying runtime immutability
                sealed.version = 2
            }).toThrow()
        })
    })

    describe('Negative Controls (Extraneous & Injected Keys Fail Closed)', () => {
        it('rejects candidate with single un-schemaed hallucinated property', () => {
            const contaminated = {
                ...validBaseFact,
                confidence_float: 0.95, // Un-schemaed LLM property
            }

            expect(() => FactNodeSchema.parse(contaminated)).toThrow(
                /unrecognized_keys/,
            )
            const res = ClosureGateBuzz.validateFactClosure(contaminated)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.errorCode).toBe('UNRECOGNIZED_KEYS')
                expect(res.unrecognizedKeys).toContain('confidence_float')
            }
            expect(() =>
                ClosureGateBuzz.assertFactClosure(contaminated),
            ).toThrow(/SCHEMA_CLOSURE_FAIL/)
        })

        it('rejects candidate with multiple injected speculative fields', () => {
            const multiContaminated = {
                ...validBaseFact,
                extra_notes: 'check later',
                speculative_flag: true,
                summary_md: '## Overview',
            }

            expect(() => FactNodeSchema.parse(multiContaminated)).toThrow(
                /unrecognized_keys/,
            )
            const res = ClosureGateBuzz.validateFactClosure(multiContaminated)
            expect(res.isValid).toBe(false)
            if (!res.isValid) {
                expect(res.unrecognizedKeys.length).toBe(3)
                expect(res.unrecognizedKeys).toContain('extra_notes')
                expect(res.unrecognizedKeys).toContain('speculative_flag')
                expect(res.unrecognizedKeys).toContain('summary_md')
            }
        })

        it('rejects casing variations of permitted keys (e.g. claimText, Claim_Text)', () => {
            const camelContaminated = {
                ...validBaseFact,
                claimText: 'Camel case duplicate',
            }
            expect(() => FactNodeSchema.parse(camelContaminated)).toThrow(
                /unrecognized_keys/,
            )
            expect(
                ClosureGateBuzz.validateFactClosure(camelContaminated).isValid,
            ).toBe(false)
        })

        it('detects extraneous keys using fast pre-flight scanner', () => {
            const dirty = {
                ...validBaseFact,
                hallucinated_prop_1: 'bad',
                hallucinated_prop_2: 123,
            }
            const extraneous = ClosureGateBuzz.detectExtraneousKeys(dirty)
            expect(extraneous).toEqual([
                'hallucinated_prop_1',
                'hallucinated_prop_2',
            ])
        })

        it('rejects non-object primitives and null literals', () => {
            const primitives = [
                null,
                undefined,
                'string',
                12345,
                true,
                [validBaseFact],
            ]
            for (const prim of primitives) {
                const res = ClosureGateBuzz.validateFactClosure(prim)
                expect(res.isValid).toBe(false)
                if (!res.isValid) {
                    expect(res.errorCode).toBe('INVALID_TYPE')
                }
            }
        })

        it('verifies exact 11 permitted key count in canonical schema declaration', () => {
            expect(FACT_NODE_PERMITTED_KEYS.length).toBe(11)
        })
    })
})
