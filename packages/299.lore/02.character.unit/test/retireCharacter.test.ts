import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as yaml from 'js-yaml'
import {
    preFlightRetireAudit,
    retireCharacterDossier,
    verifyByteZeroOffset,
} from '../buz/retireCharacter.buzz.js'

describe('Guardrailed Character Deprecation Retirement Mover', () => {
    const testRoot = path.join(process.cwd(), '.tmp_test_retire')
    const testSeriesSlug = 'test-wiregrass-basin'
    const charactersDir = path.join(
        testRoot,
        'series',
        testSeriesSlug,
        'characters',
    )
    const grievancesDir = path.join(
        testRoot,
        'series',
        testSeriesSlug,
        'grievances',
    )

    beforeEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true })
        }
        fs.mkdirSync(charactersDir, { recursive: true })
        fs.mkdirSync(grievancesDir, { recursive: true })
    })

    afterEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true })
        }
    })

    function createTestDossier(
        filename: string,
        frontmatter: Record<string, any>,
        body = '## Wants (surface)\nNone\n',
    ) {
        const yamlStr = yaml.dump(frontmatter, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
        })
        const content = `---\n${yamlStr}---\n${body}`
        fs.writeFileSync(path.join(charactersDir, filename), content, 'utf8')
    }

    function createTestGrievance(
        filename: string,
        frontmatter: Record<string, any>,
    ) {
        const yamlStr = yaml.dump(frontmatter, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
        })
        const content = `---\n${yamlStr}---\n## Surface\nNone\n`
        fs.writeFileSync(path.join(grievancesDir, filename), content, 'utf8')
    }

    it('successfully relocates clean character to _retired/ and injects tombstone metadata', () => {
        createTestDossier('char_wart.md', {
            id: 'char_wart',
            name: 'Wart',
            type: 'character',
            status: 'active',
            somatic: {
                locomotion_baseline: 'bipedal_hunched',
                available_arms_bps: 10000,
                banned_kinetic_verbs: ['climb'],
            },
            logistical: { worn: [], held: [], carried: [], cached: {} },
            epistemic: { strings_held_over: [], leverage_strings: {} },
        })

        const result = retireCharacterDossier({
            seriesSlug: testSeriesSlug,
            characterId: 'char_wart',
            departureType: 'death',
            resolutionCause: 'Sacrificed during attic breach in EP104_SC02.',
            retiredAtCycle: 47,
            customRoot: testRoot,
        })

        expect(result.characterId).toBe('char_wart')
        expect(fs.existsSync(result.newPath)).toBe(true)
        expect(fs.existsSync(result.oldPath)).toBe(false)

        const retiredContent = fs.readFileSync(result.newPath, 'utf8')
        const retiredBuf = Buffer.from(retiredContent, 'utf8')
        expect(verifyByteZeroOffset(retiredBuf).valid).toBe(true)

        const parts = retiredContent.split('---\n')
        const fm = yaml.load(parts[1]) as Record<string, any>

        expect(fm.status).toBe('DEPRECATED_ARCHIVED')
        expect(fm.somatic.banned_kinetic_verbs).toContain('*')
        expect(fm.lifecycle.retired_at_cycle).toBe(47)
        expect(fm.lifecycle.departure_type).toBe('death')
        expect(fm.lifecycle.canonical_tombstone_hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('negative control: blocks retirement when character actively holds possessions', () => {
        createTestDossier('char_wart.md', {
            id: 'char_wart',
            name: 'Wart',
            type: 'character',
            status: 'active',
            logistical: {
                worn: [],
                held: ['item_silver_spoon'], // Active held item violation
                carried: [],
                cached: {},
            },
        })

        const audit = preFlightRetireAudit(
            testSeriesSlug,
            'char_wart',
            testRoot,
        )
        expect(audit.canRetireSafely).toBe(false)
        expect(audit.heldPossessions).toContain('item_silver_spoon')

        expect(() =>
            retireCharacterDossier({
                seriesSlug: testSeriesSlug,
                characterId: 'char_wart',
                departureType: 'death',
                resolutionCause: 'Fell into pipe.',
                retiredAtCycle: 12,
                customRoot: testRoot,
            }),
        ).toThrow(/\[RETIREMENT_DANGLING_REFERENCE_BLOCK\]/)

        // Assert file was NOT moved or deleted
        expect(fs.existsSync(path.join(charactersDir, 'char_wart.md'))).toBe(
            true,
        )
    })

    it('negative control: blocks retirement when another character holds active leverage strings', () => {
        createTestDossier('char_wart.md', {
            id: 'char_wart',
            name: 'Wart',
            type: 'character',
            status: 'active',
            logistical: { worn: [], held: [], carried: [], cached: {} },
        })

        createTestDossier('char_bog.md', {
            id: 'char_bog',
            name: 'Bog',
            type: 'character',
            status: 'active',
            epistemic: {
                strings_held_over: ['char_wart'],
                leverage_strings: { char_wart: 3 },
            },
        })

        const audit = preFlightRetireAudit(
            testSeriesSlug,
            'char_wart',
            testRoot,
        )
        expect(audit.canRetireSafely).toBe(false)
        expect(audit.activeLeverageHolders).toContain('char_bog')

        expect(() =>
            retireCharacterDossier({
                seriesSlug: testSeriesSlug,
                characterId: 'char_wart',
                departureType: 'estrangement',
                resolutionCause: 'Left culvert basin.',
                retiredAtCycle: 15,
                customRoot: testRoot,
            }),
        ).toThrow(/\[ACTIVE_LEVERAGE_DEBT\]/)
    })

    it('negative control: blocks retirement when active grievance relies on character', () => {
        createTestDossier('char_wart.md', {
            id: 'char_wart',
            name: 'Wart',
            type: 'character',
            status: 'active',
            logistical: { worn: [], held: [], carried: [], cached: {} },
        })

        createTestGrievance('grv_territorial_dispute.md', {
            id: 'grv_territorial_dispute',
            participants_primary: ['char_bog', 'char_wart'],
        })

        const audit = preFlightRetireAudit(
            testSeriesSlug,
            'char_wart',
            testRoot,
        )
        expect(audit.canRetireSafely).toBe(false)
        expect(audit.unresolvedGrievances).toContain('grv_territorial_dispute')

        expect(() =>
            retireCharacterDossier({
                seriesSlug: testSeriesSlug,
                characterId: 'char_wart',
                departureType: 'missing',
                resolutionCause: 'Vanished into conduit.',
                retiredAtCycle: 20,
                customRoot: testRoot,
            }),
        ).toThrow(/\[ACTIVE_GRIEVANCE_BLOCK\]/)
    })
})
