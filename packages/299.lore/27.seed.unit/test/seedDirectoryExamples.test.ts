import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { seedDirectoryExamples } from '../buz/seedDirectoryExamples.buzz.js'
import { verifyByteZeroBuffer } from '../buz/seedWorldDefinitions.buzz.js'

describe('Series Genesis Directory Example Population Gauntlet', () => {
    let tempRepoRoot: string
    const seriesSlug = 'test-example-series'
    let seriesDir: string

    beforeEach(() => {
        tempRepoRoot = fs.mkdtempSync(
            path.join(os.tmpdir(), 'goblin-example-test-'),
        )
        seriesDir = path.join(tempRepoRoot, 'series', seriesSlug)
        fs.mkdirSync(seriesDir, { recursive: true })
    })

    afterEach(() => {
        if (fs.existsSync(tempRepoRoot)) {
            fs.rmSync(tempRepoRoot, { recursive: true, force: true })
        }
    })

    it('populates every domain directory with generic example files showcasing all entity families', () => {
        const createdFiles = seedDirectoryExamples(seriesDir, seriesSlug)

        expect(createdFiles.length).toBeGreaterThanOrEqual(10)

        // 1. characters
        const charActive = path.join(
            seriesDir,
            'characters',
            'char_example_character.md',
        )
        const charRival = path.join(
            seriesDir,
            'characters',
            'char_example_rival_character.md',
        )
        const charRetired = path.join(
            seriesDir,
            'characters',
            '_retired',
            'char_example_retired_character.md',
        )
        expect(fs.existsSync(charActive)).toBe(true)
        expect(fs.existsSync(charRival)).toBe(true)
        expect(fs.existsSync(charRetired)).toBe(true)

        // 2. locations
        const locHub = path.join(seriesDir, 'locations', 'loc_origin_hub.md')
        const locWaypoint = path.join(
            seriesDir,
            'locations',
            'loc_example_waypoint_location.md',
        )
        expect(fs.existsSync(locHub)).toBe(true)
        expect(fs.existsSync(locWaypoint)).toBe(true)

        // 3. possessions
        const possession = path.join(
            seriesDir,
            'possessions',
            'item_example_possession.md',
        )
        expect(fs.existsSync(possession)).toBe(true)

        // 4. grievances
        const grvActive = path.join(
            seriesDir,
            'grievances',
            'grv_example_grievance.md',
        )
        const grvRetired = path.join(
            seriesDir,
            'grievances',
            '_retired',
            'grv_example_retired_grievance.md',
        )
        expect(fs.existsSync(grvActive)).toBe(true)
        expect(fs.existsSync(grvRetired)).toBe(true)

        // 5. ontology
        const ontology = path.join(seriesDir, 'ontology', 'unresolved.json')
        expect(fs.existsSync(ontology)).toBe(true)
        const mysteries = JSON.parse(fs.readFileSync(ontology, 'utf8'))
        expect(Array.isArray(mysteries)).toBe(true)
        expect(mysteries.length).toBeGreaterThan(0)
        expect(mysteries[0].topic_id).toBe('mystery_example_unresolved_truth')

        // 6. pardons
        const pardon = path.join(
            seriesDir,
            'pardons',
            'pardon_example_rule_waiver.json',
        )
        expect(fs.existsSync(pardon)).toBe(true)
        const waiver = JSON.parse(fs.readFileSync(pardon, 'utf8'))
        expect(waiver.id).toBe('pardon_example_rule_waiver')

        // 7. world
        const conditions = path.join(seriesDir, 'world', 'conditions.md')
        const economy = path.join(seriesDir, 'world', 'economy.md')
        expect(fs.existsSync(conditions)).toBe(true)
        expect(fs.existsSync(economy)).toBe(true)

        // Verify Byte-0 frontmatter on all markdown files
        const markdownFiles = [
            charActive,
            charRival,
            charRetired,
            locHub,
            locWaypoint,
            possession,
            grvActive,
            grvRetired,
            conditions,
            economy,
        ]

        for (const file of markdownFiles) {
            const buf = fs.readFileSync(file)
            expect(verifyByteZeroBuffer(buf)).toBe(true)
        }

        // Verify reciprocal portal link between loc_origin_hub and loc_example_waypoint_location
        const hubContent = fs.readFileSync(locHub, 'utf8')
        expect(hubContent).toContain('loc_example_waypoint_location')
        const waypointContent = fs.readFileSync(locWaypoint, 'utf8')
        expect(waypointContent).toContain('loc_origin_hub')
    })
})
