import { describe, it, expect } from 'vitest'
import { CompileModel } from '../compile.model.js'
import {
    pass1Evaluate,
    pass2Traverse,
    stylometricLint,
} from '../buz/compile.buzz.js'

describe('43.compile.unit :: Wiregrass Basin (The Parallax Dinner) Corpus Topology', () => {
    it('passes Pass 1 structural bounds, 7-bit ASCII, Byte-0, and Somatic SAT for all 9 entities', () => {
        const model = new CompileModel()
        let resBit: any

        pass1Evaluate(model, {
            idx: 'test-pass1-wiregrass',
            seriesSlug: 'wiregrass-basin',
            slv: (res: any) => {
                resBit = res.cmpBit
            },
        })

        expect(resBit).toBeDefined()
        expect(resBit.val).toBe(1)
        expect(resBit.catalogSummary.totalEntities).toBe(9)
        expect(resBit.catalogSummary.characters).toBe(3)
        expect(resBit.catalogSummary.locations).toBe(2)
        expect(resBit.catalogSummary.items).toBe(3)
        expect(resBit.catalogSummary.grievances).toBe(1)
        expect(resBit.validationReport.byte0Compliant).toBe(true)
        expect(resBit.validationReport.ascii7BitCompliant).toBe(true)
        expect(resBit.validationReport.schemaValid).toBe(true)
        expect(resBit.validationReport.somaticSatValid).toBe(true)
        expect(resBit.validationReport.errors).toEqual([])
    })

    it('passes Pass 2 foreign-key closure, 3-color DFS grievance acyclicity, and portal reciprocity', () => {
        const model = new CompileModel()
        let resBit: any

        pass2Traverse(model, {
            idx: 'test-pass2-wiregrass',
            seriesSlug: 'wiregrass-basin',
            slv: (res: any) => {
                resBit = res.cmpBit
            },
        })

        expect(resBit).toBeDefined()
        expect(resBit.val).toBe(1)
        expect(resBit.validationReport.foreignKeysValid).toBe(true)
        expect(resBit.validationReport.grievanceDagAcyclic).toBe(true)
        expect(resBit.validationReport.spatialPortalsReciprocal).toBe(true)
        expect(resBit.validationReport.acousticAttenuationValid).toBe(true)
        expect(resBit.validationReport.errors).toEqual([])
    })

    it('passes Level 3 stylometric lexical diversity and voice-bleed collision audit', () => {
        const model = new CompileModel()
        let resBit: any

        stylometricLint(model, {
            idx: 'test-stylometric-wiregrass',
            seriesSlug: 'wiregrass-basin',
            slv: (res: any) => {
                resBit = res.cmpBit
            },
        })

        expect(resBit).toBeDefined()
        expect(resBit.val).toBe(1)
        expect(resBit.stylometricReport.passed).toBe(true)
        expect(resBit.stylometricReport.slopViolations).toEqual([])
        expect(resBit.stylometricReport.voiceBleedCollisions).toEqual([])
    })
})
