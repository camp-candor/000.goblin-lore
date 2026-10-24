import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { executePassOneGenesisShape } from '../buz/passOneGenesisShape.buzz.js'
import { executePassTwoGenesisGraph } from '../buz/passTwoGenesisGraph.buzz.js'
import {
    executePassThreeGenesisSeal,
    canonicalizeJson,
} from '../buz/passThreeGenesisSeal.buzz.js'
import { writeWormSnapshot } from '../buz/writeWormSnapshot.buzz.js'
import * as loreBuzz from '../../00.lore.unit/buz/lore.buzz.js'

describe('Phase 5 Pre-Flight Genesis Seal Compilation', () => {
    const testRoot = path.join(process.cwd(), '.tmp_test_genesis_compiler')
    const seriesSlug = 'wiregrass-basin'

    beforeEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        vi.spyOn(loreBuzz, 'resolveRepoRoot').mockReturnValue(testRoot)

        // Setup mock series directory
        const seriesDir = path.join(testRoot, 'series', seriesSlug)
        fs.mkdirSync(path.join(seriesDir, 'characters'), { recursive: true })
        fs.mkdirSync(path.join(seriesDir, 'locations'), { recursive: true })
        fs.mkdirSync(path.join(seriesDir, 'possessions'), { recursive: true })
        fs.mkdirSync(path.join(seriesDir, 'grievances'), { recursive: true })
        fs.mkdirSync(path.join(testRoot, 'compiled', seriesSlug), {
            recursive: true,
        })

        // Seed mock series.config.json
        fs.writeFileSync(
            path.join(seriesDir, 'series.config.json'),
            JSON.stringify({
                series_slug: seriesSlug,
                genre_tag: 'SOUTHERN_GOTHIC_INDUSTRIAL',
            }) + '\n',
        )

        // Seed mock loc_origin_hub.md (Byte-0 verified)
        fs.writeFileSync(
            path.join(seriesDir, 'locations', 'loc_origin_hub.md'),
            '---\nid: "loc_origin_hub"\ntitle: "Origin Hub"\n---\n\n## Description\nOrigin hub.\n',
        )

        // Seed mock item_founder_token.md (Byte-0 verified)
        fs.writeFileSync(
            path.join(seriesDir, 'possessions', 'item_founder_token.md'),
            '---\nid: "item_founder_token"\nname: "Founder Token"\nmass_grams: 35\nweight_class: "scrap"\nslot_category: "held"\nhands_required_bps: 10000\ncustody_holder: "char_protagonist"\n---\n',
        )

        // Seed mock char_protagonist.md (Byte-0 verified)
        fs.writeFileSync(
            path.join(seriesDir, 'characters', 'char_protagonist.md'),
            '---\nid: "char_protagonist"\nname: "Protagonist"\nstaged_location_id: "loc_origin_hub"\ninventory:\n  held_primary: "item_founder_token"\nsomatic:\n  available_arms_bps: 20000\n---\n',
        )

        // Seed mock grv_territorial_impasse.md (Byte-0 verified)
        fs.writeFileSync(
            path.join(seriesDir, 'grievances', 'grv_territorial_impasse.md'),
            '---\nid: "grv_territorial_impasse"\nparticipants_primary:\n  - "char_protagonist"\nlocation_anchor: "loc_origin_hub"\nphysical_anchor_prop: "item_founder_token"\nspawns_on_max_escalation: null\n---\n',
        )
    })

    afterEach(() => {
        if (fs.existsSync(testRoot))
            fs.rmSync(testRoot, { recursive: true, force: true })
        vi.restoreAllMocks()
    })

    it('Pass 1: parses all four Byte-0 seed dossiers cleanly', () => {
        const res = executePassOneGenesisShape(seriesSlug)
        expect(res.passed).toBe(true)
        expect(res.totalEntities).toBe(4)
        expect(res.registry.characters['char_protagonist']).toBeDefined()
        expect(res.registry.locations['loc_origin_hub']).toBeDefined()
        expect(res.registry.possessions['item_founder_token']).toBeDefined()
        expect(res.registry.grievances['grv_territorial_impasse']).toBeDefined()
    })

    it('Pass 1: fails closed when a file violates Byte-0 offset', () => {
        // Inject a leading newline before '---'
        const charFile = path.join(
            testRoot,
            'series',
            seriesSlug,
            'characters',
            'char_protagonist.md',
        )
        fs.writeFileSync(charFile, '\n---\nid: "char_protagonist"\n---\n')

        const res = executePassOneGenesisShape(seriesSlug)
        expect(res.passed).toBe(false)
        expect(res.error).toContain('BYTE_ZERO_OFFSET_BREACH')
    })

    it('Pass 2: certifies relational pointers and DAG acyclicity', () => {
        const passOne = executePassOneGenesisShape(seriesSlug)
        const passTwo = executePassTwoGenesisGraph(passOne.registry)
        expect(passTwo.passed).toBe(true)
    })

    it('Pass 2: fails closed when a character references a missing location', () => {
        const passOne = executePassOneGenesisShape(seriesSlug)
        passOne.registry.characters['char_protagonist'].staged_location_id =
            'loc_nonexistent'

        const passTwo = executePassTwoGenesisGraph(passOne.registry)
        expect(passTwo.passed).toBe(false)
        expect(passTwo.error).toContain('DANGLING_LOCATION_POINTER')
    })

    it('Pass 2: fails closed on circular grievance loops', () => {
        const passOne = executePassOneGenesisShape(seriesSlug)
        passOne.registry.grievances[
            'grv_territorial_impasse'
        ].spawns_on_max_escalation = 'grv_territorial_impasse'

        const passTwo = executePassTwoGenesisGraph(passOne.registry)
        expect(passTwo.passed).toBe(false)
        expect(passTwo.error).toContain('CIRCULAR_GRIEVANCE_DAG_DETECTED')
    })

    it('Pass 3: canonicalizes and computes deterministic Merkle root (H_root)', () => {
        const passOne = executePassOneGenesisShape(seriesSlug)
        const passThree = executePassThreeGenesisSeal(
            seriesSlug,
            passOne.seriesConfig,
            passOne.registry,
        )

        expect(passThree.passed).toBe(true)
        expect(passThree.merkleRoot).toMatch(/^[0-9a-f]{64}$/)
        expect(fs.existsSync(passThree.canonicalHeadPath)).toBe(true)

        const saved = JSON.parse(
            fs.readFileSync(passThree.canonicalHeadPath, 'utf-8'),
        )
        expect(saved._meta.state_hash).toBe(passThree.merkleRoot)
        expect(saved._meta.entity_counts.total).toBe(4)
    })

    it('writeWormSnapshot: creates a Windows-safe ISO snapshot archive', () => {
        const passOne = executePassOneGenesisShape(seriesSlug)
        const passThree = executePassThreeGenesisSeal(
            seriesSlug,
            passOne.seriesConfig,
            passOne.registry,
        )
        const worm = writeWormSnapshot(seriesSlug, passThree.compiledState)

        expect(worm.passed).toBe(true)
        expect(fs.existsSync(worm.wormPath)).toBe(true)
        expect(path.basename(worm.wormPath)).toMatch(
            /^bible-state_\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z\.json$/,
        )
    })

    it('canonicalizeJson: enforces RFC 8785 key-order determinism', () => {
        const objA = { b: 2, a: 1, nested: { z: 10, y: 20 } }
        const objB = { nested: { y: 20, z: 10 }, a: 1, b: 2 }
        expect(canonicalizeJson(objA)).toBe(canonicalizeJson(objB))
    })
})
