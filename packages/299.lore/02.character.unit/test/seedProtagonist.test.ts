import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as yaml from 'js-yaml'
import {
    buildSeedProtagonistDossier,
    generateSeedProtagonistDossier,
    verifyByteZeroOffset,
} from '../buz/seedProtagonist.buzz.js'
import { extractDossierSections } from '../../26.schema.unit/buz/schema.buzz.js'
import { CharacterFrontmatterSchema } from '../../26.schema.unit/val/characterFrontmatter.val.js'

describe('Seed Protagonist Genesis Dossier Generator', () => {
    const testRoot = path.join(process.cwd(), '.tmp_test_genesis')
    const testSeriesSlug = 'test-wiregrass-basin'

    beforeEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true })
        }
        fs.mkdirSync(testRoot, { recursive: true })
    })

    afterEach(() => {
        if (fs.existsSync(testRoot)) {
            fs.rmSync(testRoot, { recursive: true, force: true })
        }
    })

    it('enforces the Byte-0 Frontmatter Law on emitted markdown', () => {
        const { markdownContent } = buildSeedProtagonistDossier({
            seriesSlug: testSeriesSlug,
        })

        const buf = Buffer.from(markdownContent, 'utf8')

        // Must start with 0x2D 0x2D 0x2D 0x0A (--- + \n)
        expect(buf[0]).toBe(0x2d)
        expect(buf[1]).toBe(0x2d)
        expect(buf[2]).toBe(0x2d)
        expect(buf[3]).toBe(0x0a)

        const check = verifyByteZeroOffset(buf)
        expect(check.valid).toBe(true)
    })

    it('persists char_protagonist.md atomically and verifies content hash', () => {
        const result = generateSeedProtagonistDossier(
            { seriesSlug: testSeriesSlug },
            testRoot,
        )

        expect(result.characterId).toBe('char_protagonist')
        expect(result.byteZeroVerified).toBe(true)
        expect(result.contentSha256).toMatch(/^[a-f0-9]{64}$/)
        expect(fs.existsSync(result.filePath)).toBe(true)

        const writtenBytes = fs.readFileSync(result.filePath)
        expect(verifyByteZeroOffset(writtenBytes).valid).toBe(true)
    })

    it('emits schema-compliant frontmatter and extracts valid Voice Rail sections', () => {
        const { markdownContent } = buildSeedProtagonistDossier({
            seriesSlug: testSeriesSlug,
            characterName: 'Kaelen',
            founderTokenItemId: 'item_founder_token',
        })

        const { frontmatterText, bodyText } =
            extractDossierSections(markdownContent)
        const parsedYaml = yaml.load(frontmatterText)
        const validated = CharacterFrontmatterSchema.parse(parsedYaml)

        expect(validated.id).toBe('char_protagonist')
        expect(validated.name).toBe('Kaelen')
        expect(validated.somatic.locomotion_baseline).toBe('bipedal_hunched')
        expect(validated.somatic.available_arms_bps).toBe(20000)
        expect(validated.logistical.held).toContain('item_founder_token')
        expect(validated.refusal_vectors.length).toBeGreaterThan(0)
        expect(validated.refusal_vectors[0].refusal_id).toBe(
            'ref_protagonist_token_custody',
        )

        expect(bodyText).toContain('## Wants (surface)')
        expect(bodyText).toContain('## Wants (actual)')
        expect(bodyText).toContain('## Blind spot')
        expect(bodyText).toContain('## Voice notes')
        expect(bodyText).toContain('## Few-shot lines')
    })

    it('supports custom protagonist overrides during genesis initialization', () => {
        const result = generateSeedProtagonistDossier(
            {
                seriesSlug: testSeriesSlug,
                characterId: 'char_custom_pilot',
                characterName: 'Pilot Vance',
                surfaceWant: 'Find replacement copper gaskets.',
                actualWant: 'Flee the county before the foreclosure audit.',
            },
            testRoot,
        )

        expect(result.characterId).toBe('char_custom_pilot')
        const content = fs.readFileSync(result.filePath, 'utf8')
        expect(content).toContain('id: char_custom_pilot')
        expect(content).toContain('name: Pilot Vance')
        expect(content).toContain('Find replacement copper gaskets.')
        expect(content).toContain(
            'Flee the county before the foreclosure audit.',
        )
    })

    it('negative control: rejects invalid seriesSlug with descriptive failure', () => {
        expect(() =>
            generateSeedProtagonistDossier({ seriesSlug: '' }, testRoot),
        ).toThrow(/seriesSlug is required/)
    })
})
