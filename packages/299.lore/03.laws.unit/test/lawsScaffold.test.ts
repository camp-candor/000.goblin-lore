/**
 * packages/299.lore/03.laws.unit/test/lawsScaffold.test.ts
 * Vitest verification battery for Interactive World Axiom Scaffolding Interview.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { LawsModel } from '../laws.model'
import * as ActLaw from '../laws.action'
import { reducer } from '../laws.reduce'
import {
    validateClueLemmaDisjointness,
    renderWorldAxiomDossierMarkdown,
    writeWorldAxiomDossierAtomic,
} from '../buz/lawsScaffold.buzz'

describe('Interactive World Axiom Scaffolding Interview (03.laws.unit)', () => {
    const tmpTestDir = path.join(process.cwd(), '.tmp_test_laws_scaffold')

    afterEach(() => {
        if (fs.existsSync(tmpTestDir)) {
            fs.rmSync(tmpTestDir, { recursive: true, force: true })
        }
    })

    it('P0.1: validates Clue-Lemma Disjointness Theorem: rejects contaminated clue tokens', () => {
        // Overlapping clue token containing forbidden conclusion lemma 'arson'
        const invalidCheck = validateClueLemmaDisjointness(
            ['smell of kerosene', 'arson evidence', 'chipped valve'],
            ['arson', 'sabotage'],
        )

        expect(invalidCheck.valid).toBe(false)
        expect(invalidCheck.intersectingTokens).toEqual(['arson evidence'])
        // Exact match on 'arson'
        const directMatch = validateClueLemmaDisjointness(
            ['arson', 'scorched pipe'],
            ['arson'],
        )
        expect(directMatch.valid).toBe(false)
        expect(directMatch.intersectingTokens).toEqual(['arson'])

        // Pure disjoint sets -> MUST PASS
        const validCheck = validateClueLemmaDisjointness(
            ['scorched pipe', 'smell of sulfur', 'bent hinge'],
            ['sabotage', 'arson'],
        )
        expect(validCheck.valid).toBe(true)
    })

    it('P0.2: formats world axiom dossier strictly beginning with --- at Byte 0', () => {
        const md = renderWorldAxiomDossierMarkdown({
            id: 'world_floorboard_physics',
            name: 'Floorboard Physical Invariants',
            domain: 'PHYSICAL_METAPHYSICAL',
            epoch: 'post_famine_consolidation',
            dominantFactions: ['pipe_dwellers', 'crawlspace_runners'],
            axioms: [
                'Combustion open flame is strictly banned beneath floorboards.',
            ],
            epistemicDefault: 'TOTAL_IGNORANCE',
            clueTokens: ['scented grease residue'],
            forbiddenConclusionLemmas: ['poison'],
        })

        const buf = Buffer.from(md, 'utf8')
        expect(buf[0]).toBe(0x2d) // '-'
        expect(buf[1]).toBe(0x2d) // '-'
        expect(buf[2]).toBe(0x2d) // '-'
        expect(buf[3]).toBe(0x0a) // '\n'
        expect(md.includes('id: world_floorboard_physics')).toBe(true)
        expect(md.includes('epoch: post_famine_consolidation')).toBe(true)
        expect(md.includes('default_horizon: TOTAL_IGNORANCE')).toBe(true)
        expect(md.includes('## Metaphysical Laws')).toBe(true)
        expect(md.includes('## Social Axioms')).toBe(true)
        expect(md.includes('## Unresolved Mysteries')).toBe(true)
    })

    it('P0.3: executes atomic POSIX file persistence and enforces Byte 0 invariant', () => {
        const targetFile = path.join(tmpTestDir, 'world_atomic_axiom.md')
        const content = renderWorldAxiomDossierMarkdown({
            id: 'world_atomic_axiom',
            name: 'Atomic Axiom Test',
            domain: 'ECONOMIC_SCARCITY',
            epoch: 'the_great_chill',
            dominantFactions: [],
            axioms: ['Calories cannot exceed daily rationing baseline.'],
            epistemicDefault: 'RUMOR_ONLY',
            clueTokens: [],
            forbiddenConclusionLemmas: [],
        })

        writeWorldAxiomDossierAtomic(targetFile, content)

        expect(fs.existsSync(targetFile)).toBe(true)
        const readBuf = fs.readFileSync(targetFile)
        expect(readBuf[0]).toBe(0x2d)
        expect(readBuf[1]).toBe(0x2d)
        expect(readBuf[2]).toBe(0x2d)
    })

    it('P0.4: routes SCAFFOLD_WORLD_WIZARD through reducer with state bus mocks', async () => {
        const model = new LawsModel()
        const calls: Array<{ action: string; payload: any }> = []

        const mockState: any = {
            hunt: vi.fn(async (action: string, payload: any) => {
                calls.push({ action, payload })
                return {}
            }),
        }

        let resolvedResult: any = null
        const action = new ActLaw.ScaffoldWorldWizard({
            idx: 'test-world-wizard',
            dat: {
                seriesSlug: 'test-series',
                axiomId: 'world_unit_test',
                name: 'Unit Test World Axioms',
                domain: 'PHYSICAL_METAPHYSICAL',
                epoch: 'culvert_excavation_era',
                axioms: ['Upstairs humans are never addressed directly.'],
                epistemicDefault: 'TOTAL_IGNORANCE',
                clueTokens: ['scratched latch'],
                forbiddenConclusionLemmas: ['break_in'],
            },
            slv: (res) => {
                resolvedResult = res
            },
        })

        await reducer(model, action, mockState)

        expect(resolvedResult).toBeDefined()
        expect(resolvedResult.success).toBe(true)
        expect(resolvedResult.axiomId).toBe('world_unit_test')

        const consoleCalls = calls.filter(
            (c) => c.action === '[Console action] Update Console',
        )
        expect(consoleCalls.length).toBeGreaterThan(0)
        const sealedCall = consoleCalls.find((c) =>
            c.payload?.src?.includes('written to disk at Byte 0'),
        )
        expect(sealedCall).toBeDefined()

        // Clean up created file in series/test-series if written
        if (resolvedResult.filePath && fs.existsSync(resolvedResult.filePath)) {
            fs.unlinkSync(resolvedResult.filePath)
            const parentDir = path.dirname(resolvedResult.filePath)
            if (fs.existsSync(parentDir)) fs.rmdirSync(parentDir)
        }
    })
})
