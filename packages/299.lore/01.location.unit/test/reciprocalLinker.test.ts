import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { reconcileReciprocalLinks } from '../buz/reciprocalLinker.buzz.js'
import { parseLocationMarkdown } from '../buz/portalSymmetry.buzz.js'
import { LocationModel } from '../location.model.js'

describe('Phase 6 Reciprocal Spatial Portal Graph Linker Gauntlet', () => {
    let tempRepoRoot: string
    const seriesSlug = 'test-spatial-series'

    beforeEach(() => {
        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'goblin-spatial-test-'),
        )
        const locDir = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'locations',
        )
        fs.mkdirSync(locDir, { recursive: true })

        // Node A (Origin Hub)
        fs.writeFileSync(
            path.join(locDir, 'loc_chamber_a.md'),
            [
                '---',
                'id: "loc_chamber_a"',
                'title: "Chamber Alpha"',
                'type: "location"',
                'axial_coordinates:',
                '  q: 0',
                '  r: 0',
                '  s: 0',
                'max_adult_occupants: 2',
                'acoustic_damping_cdb: 1500',
                'lighting: "dim_crevice"',
                'portal_links:',
                '  - portal_slug: "portal_a_to_b"',
                '    target_location_id: "loc_chamber_b"',
                '    damping_cdb: 2000',
                '    line_of_sight: false',
                '---',
                '',
                '## Description',
                'Primary chamber with single conduit leading to Chamber Beta.',
                '',
            ].join('\n'),
            'utf8',
        )

        // Node B (Adjacent Chamber) - Initially empty portal_links
        fs.writeFileSync(
            path.join(locDir, 'loc_chamber_b.md'),
            [
                '---',
                'id: "loc_chamber_b"',
                'title: "Chamber Beta"',
                'type: "location"',
                'axial_coordinates:',
                '  q: 1',
                '  r: 0',
                '  s: -1',
                'max_adult_occupants: 3',
                'acoustic_damping_cdb: 1800',
                'lighting: "dark"',
                'portal_links: []',
                '---',
                '',
                '## Description',
                'Secondary chamber awaiting reciprocal spatial coupling.',
                '',
            ].join('\n'),
            'utf8',
        )
    })

    afterEach(() => {
        if (fs.existsSync(tempRepoRoot)) {
            fs.rmSync(tempRepoRoot, { recursive: true, force: true })
        }
    })

    it('automatically injects symmetric reverse portal into Chamber B when reconciling Chamber A', async () => {
        const model = new LocationModel()
        let result: any = null

        const bal = {
            idx: 'test-reconcile',
            dat: {
                seriesSlug,
                locationId: 'loc_chamber_a',
                repoRoot: tempRepoRoot,
            },
            slv: (res: any) => {
                result = res
            },
        }

        await reconcileReciprocalLinks(model, bal as any)

        expect(result).toBeDefined()
        expect(result.locationBit.val).toBe(1)
        expect(result.locationBit.dat.symmetrical).toBe(true)
        expect(result.locationBit.dat.mutatedFiles.length).toBe(1)

        // Verify Chamber B updated on disk
        const bFile = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'locations',
            'loc_chamber_b.md',
        )
        const bRaw = fs.readFileSync(bFile, 'utf8')
        const bDossier = parseLocationMarkdown(bRaw)

        expect(bDossier.byteZeroOk).toBe(true)
        expect(bDossier.frontmatter.portal_links.length).toBe(1)

        const reversePortal = bDossier.frontmatter.portal_links[0]
        expect(reversePortal.target_location_id).toBe('loc_chamber_a')
        expect(reversePortal.damping_cdb).toBe(2000) // Symmetrical damping match
        expect(reversePortal.line_of_sight).toBe(false)
    })

    it('fails closed when a location references a dangling non-existent target ID', async () => {
        const locDir = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'locations',
        )
        fs.writeFileSync(
            path.join(locDir, 'loc_dangling.md'),
            [
                '---',
                'id: "loc_dangling"',
                'title: "Dangling Node"',
                'type: "location"',
                'portal_links:',
                '  - portal_slug: "portal_to_void"',
                '    target_location_id: "loc_non_existent"',
                '    damping_cdb: 1500',
                '    line_of_sight: false',
                '---',
                '',
                '## Void Pointer',
                'Dossier referencing void target.',
                '',
            ].join('\n'),
            'utf8',
        )

        const model = new LocationModel()
        let result: any = null

        const bal = {
            idx: 'test-dangling',
            dat: {
                seriesSlug,
                locationId: 'loc_dangling',
                repoRoot: tempRepoRoot,
            },
            slv: (res: any) => {
                result = res
            },
        }

        await reconcileReciprocalLinks(model, bal as any)

        expect(result).toBeDefined()
        expect(result.locationBit.val).toBe(0)
        expect(result.locationBit.dat.symmetrical).toBe(false)
        expect(result.locationBit.dat.errors[0]).toContain(
            '[DANGLING_SPATIAL_POINTER]',
        )
    })

    it('avoids duplicate reverse portal injection on repeated reconciliations', async () => {
        const model = new LocationModel()
        const bal = {
            idx: 'test-idempotent',
            dat: {
                seriesSlug,
                locationId: 'loc_chamber_a',
                repoRoot: tempRepoRoot,
            },
            slv: () => {},
        }

        // Run 1
        await reconcileReciprocalLinks(model, bal as any)
        // Run 2
        let secondResult: any = null
        await reconcileReciprocalLinks(model, {
            ...bal,
            slv: (res: any) => {
                secondResult = res
            },
        } as any)

        expect(secondResult.locationBit.val).toBe(1)
        expect(secondResult.locationBit.dat.mutatedFiles.length).toBe(0) // No mutations on second run

        const bFile = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'locations',
            'loc_chamber_b.md',
        )
        const bRaw = fs.readFileSync(bFile, 'utf8')
        const bDossier = parseLocationMarkdown(bRaw)
        expect(bDossier.frontmatter.portal_links.length).toBe(1)
    })

    it('fails closed with [SELF_ADJACENCY_VIOLATION] when a location links to itself', async () => {
        const locDir = path.join(
            tempRepoRoot,
            'series',
            seriesSlug,
            'locations',
        )
        fs.writeFileSync(
            path.join(locDir, 'loc_self.md'),
            [
                '---',
                'id: "loc_self"',
                'title: "Self Loop Node"',
                'type: "location"',
                'portal_links:',
                '  - portal_slug: "self_loop"',
                '    target_location_id: "loc_self"',
                '    damping_cdb: 1000',
                '    line_of_sight: true',
                '---',
                '',
                '## Description',
                'Self-referential portal trap.',
                '',
            ].join('\n'),
            'utf8',
        )

        const model = new LocationModel()
        let result: any = null

        await reconcileReciprocalLinks(model, {
            idx: 'test-self-loop',
            dat: {
                seriesSlug,
                locationId: 'loc_self',
                repoRoot: tempRepoRoot,
            },
            slv: (res: any) => {
                result = res
            },
        } as any)

        expect(result).toBeDefined()
        expect(result.locationBit.val).toBe(0)
        expect(result.locationBit.dat.symmetrical).toBe(false)
        expect(result.locationBit.dat.errors[0]).toContain(
            '[SELF_ADJACENCY_VIOLATION]',
        )
    })
})
