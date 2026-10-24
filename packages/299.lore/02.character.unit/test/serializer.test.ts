import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
    serializeCharacterDossierToDisk,
    buildCharacterDossierMarkdown,
    verifyByteZeroOffset,
    sanitizeVoiceRailProse,
} from '../buz/serializer.buzz.js'
import { CharacterFrontmatter } from '../../26.schema.unit/val/characterFrontmatter.val.js'
import { VoiceRailSectionsBit } from '../../26.schema.unit/fce/characterDossier.bit.js'

describe('Interactive Character Dossier Disk Serializer', () => {
    const testRoot = path.join(process.cwd(), '.tmp_test_serializer')
    const testSeriesSlug = 'test-wiregrass-basin'

    const validFrontmatter: CharacterFrontmatter = {
        id: 'char_bog',
        name: 'Bog',
        type: 'character',
        status: 'active',
        somatic: {
            locomotion_baseline: 'bipedal_hunched',
            available_arms_bps: 20000,
            banned_kinetic_verbs: ['sprint', 'vault'],
            conditions: [],
            motor_limitations: ['UNSTEADY_GAIT'],
            signature_tics: ['rubs grease off knuckles'],
            sensory: {
                optical_state: 'NORMAL',
                blind_cone_degrees: 0,
                auditory_floor_debuff_cdb: 0,
            },
            vocal_dsp: {
                pitch_shift_centitones: -150,
                speed_multiplier_bps: 9000,
                pause_frequency_bps: 14000,
            },
        },
        logistical: {
            worn: [],
            held: ['item_silver_spoon'],
            carried: [],
            cached: {},
        },
        epistemic: {
            escalation_ceiling: 3,
            strings_held_over: ['char_wart'],
            leverage_strings: { char_wart: 2 },
            relationship_defaults: { char_wart: 'suspicious' },
            attenuation_tokens: ['famine'],
        },
        refusal_vectors: [
            {
                refusal_id: 'ref_bog_food_admission',
                trigger: 'Accused of hiding salt pork rations',
                mandatory_refusal: 'Never admits hunger or hidden cache',
                unavoidable_cost: 'Takes physical blow from interlocutor',
                strain_threshold_bps: 7500,
                post_break_state: 'Weeping collapse over cellar drain',
            },
        ],
        comedic_register: 'deadpan',
        pending_showrunner_task: null,
        emotion_visual_mapping: {},
        created_at_epoch: 0,
    }

    const validVoiceRail: VoiceRailSectionsBit = {
        wantsSurface:
            'Clean the tarnished spoon[cite: 1, 2] <!-- unedited comment -->',
        wantsActual:
            'Secure territorial tenure without acknowledging the famine.',
        blindSpot: 'Refuses to believe the crawlspace roof is collapsing.',
        voiceNotes:
            'Short clipped sentences, gravelly dialect, heavy staccato pacing.',
        fewShotLines: [
            '- The conduit seam holds cold. You cross that chalk, you leave the boot behind.',
            '- No grease on the bevel. Keep the rag dry.[cite: 4]',
        ],
    }

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

    it('enforces the Byte-0 Frontmatter Law on output buffer', () => {
        const { markdownContent } = buildCharacterDossierMarkdown({
            seriesSlug: testSeriesSlug,
            frontmatter: validFrontmatter,
            voiceRail: validVoiceRail,
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

    it('strips citation markers and HTML comment placeholders from voice rail prose', () => {
        const sanitized = sanitizeVoiceRailProse(
            'Clean spoon[cite: 1, 2] <!-- placeholder -->',
        )
        expect(sanitized).toBe('Clean spoon')
    })

    it('atomically commits char_bog.md and returns valid SHA-256 digest', () => {
        const result = serializeCharacterDossierToDisk({
            seriesSlug: testSeriesSlug,
            frontmatter: validFrontmatter,
            voiceRail: validVoiceRail,
            customRoot: testRoot,
        })

        expect(result.characterId).toBe('char_bog')
        expect(result.byteZeroVerified).toBe(true)
        expect(result.contentSha256).toMatch(/^[a-f0-9]{64}$/)
        expect(fs.existsSync(result.filePath)).toBe(true)

        const writtenText = fs.readFileSync(result.filePath, 'utf8')
        expect(writtenText).not.toContain('[cite: 1, 2]')
        expect(writtenText).not.toContain('<!-- unedited comment -->')
    })

    it('negative control: halts disk write when Hand Saturation SAT is breached', () => {
        const invalidFrontmatter = JSON.parse(
            JSON.stringify(validFrontmatter),
        ) as CharacterFrontmatter
        invalidFrontmatter.somatic.available_arms_bps = 10000 // 1.0 arm
        invalidFrontmatter.logistical.held = ['item_sword', 'item_shield'] // 2 items > 1 arm

        expect(() =>
            serializeCharacterDossierToDisk({
                seriesSlug: testSeriesSlug,
                frontmatter: invalidFrontmatter,
                voiceRail: validVoiceRail,
                customRoot: testRoot,
            }),
        ).toThrow(/\[HAND_CAPACITY_SAT_VIOLATION\]/)
    })
})
