import { describe, it, expect } from 'vitest'
import * as yaml from 'js-yaml'
import {
    CharacterFrontmatterSchema,
    CanonicalCharacterFrontmatterSchema,
    SensoryAcuitySchema,
} from '../val/characterFrontmatter.val.js'
import {
    verifyByteZeroOffset,
    extractDossierSections,
    parseVoiceRailBody,
    deepFreeze,
} from '../buz/schema.buzz.js'

describe('Dual-Rail Character Frontmatter Schema Composition', () => {
    const validDossierMarkdown = `---
id: char_bog
name: Bog
type: character
status: active
somatic:
  locomotion_baseline: bipedal_hunched
  available_arms_bps: 20000
  banned_kinetic_verbs:
    - sprint
    - vault
  conditions: []
  motor_limitations:
    - NO_SPRINT
  signature_tics:
    - rubs grease off knuckles
  sensory:
    optical_state: NORMAL
    blind_cone_degrees: 0
    auditory_floor_debuff_cdb: 0
  vocal_dsp:
    pitch_shift_centitones: -150
    speed_multiplier_bps: 9000
    pause_frequency_bps: 14000
logistical:
  worn: []
  held:
    - item_silver_spoon
  carried: []
  cached: {}
epistemic:
  escalation_ceiling: 3
  strings_held_over:
    - char_wart
  leverage_strings:
    char_wart: 2
  relationship_defaults:
    char_wart: suspicious
  attenuation_tokens:
    - famine
refusal_vectors:
  - refusal_id: ref_bog_food_admission
    trigger: Accused of hiding salt pork rations
    mandatory_refusal: Never admits hunger or hidden cache
    unavoidable_cost: Takes physical blow from interlocutor
    strain_threshold_bps: 7500
    post_break_state: Weeping collapse over cellar drain
comedic_register: deadpan
pending_showrunner_task: null
created_at_epoch: 0
---

## Wants (surface)
Clean the tarnished spoon before Mum Grissel returns.

## Wants (actual)
Secure territorial survival tenure without acknowledging the famine.

## Blind spot
Refuses to believe the crawlspace roof is collapsing.

## Voice notes
Short clipped sentences, gravelly dialect, heavy staccato pacing.

## Few-shot lines
- The conduit seam holds cold. You cross that chalk, you leave the boot behind.
- No grease on the bevel. Keep the rag dry.
`

    it('enforces Byte-0 Frontmatter Law by rejecting UTF-8 BOM', () => {
        const bomBuffer = Buffer.concat([
            Buffer.from([0xef, 0xbb, 0xbf]),
            Buffer.from(validDossierMarkdown, 'utf8'),
        ])
        const check = verifyByteZeroOffset(bomBuffer)
        expect(check.valid).toBe(false)
        expect(check.errorCode).toBe('BYTE_0_BOM_VIOLATION')
    })

    it('rejects dossiers with leading whitespace before delimiter', () => {
        const badDossier = ' ' + validDossierMarkdown
        const check = verifyByteZeroOffset(badDossier)
        expect(check.valid).toBe(false)
        expect(check.errorCode).toBe('BYTE_0_DELIMITER_MISSING')
    })

    it('rejects dossiers with non-POSIX CRLF line endings', () => {
        const crlfDossier = validDossierMarkdown.replace(/\n/g, '\r\n')
        const check = verifyByteZeroOffset(crlfDossier)
        expect(check.valid).toBe(false)
        expect(check.errorCode).toBe('NON_POSIX_CARRIAGE_RETURN')
    })

    it('successfully parses and validates valid CharacterFrontmatter', () => {
        const { frontmatterText, bodyText } =
            extractDossierSections(validDossierMarkdown)
        const parsed = yaml.load(frontmatterText)
        const validated = CanonicalCharacterFrontmatterSchema.parse(parsed)

        expect(validated.id).toBe('char_bog')
        expect(validated.somatic.locomotion_baseline).toBe('bipedal_hunched')
        expect(validated.somatic.available_arms_bps).toBe(20000)
        expect(validated.refusal_vectors[0].refusal_id).toBe(
            'ref_bog_food_admission',
        )

        const voiceRail = parseVoiceRailBody(bodyText)
        expect(voiceRail.wantsSurface).toBe(
            'Clean the tarnished spoon before Mum Grissel returns.',
        )
        expect(voiceRail.fewShotLines.length).toBe(2)
    })

    it('fails closed on unknown frontmatter fields (.strict())', () => {
        const badYaml = {
            id: 'char_bog',
            name: 'Bog',
            type: 'character',
            somatic: { locomotion_baseline: 'bipedal_standard' },
            illegal_hallucinated_field: 'corrupts_canon',
        }
        expect(() => CharacterFrontmatterSchema.parse(badYaml)).toThrow()
    })

    it('enforces Monocular vision blind cone invariant', () => {
        expect(() =>
            SensoryAcuitySchema.parse({
                optical_state: 'MONOCULAR',
                blind_cone_degrees: 30, // Must be >= 60
            }),
        ).toThrow()
    })

    it('guarantees deep immutability through deepFreeze', () => {
        const obj = deepFreeze({ nested: { val: 42 }, arr: [1, 2, 3] })
        expect(() => {
            ;(obj as any).nested.val = 99
        }).toThrow()
        expect(() => {
            ;(obj as any).arr.push(4)
        }).toThrow()
    })
})
