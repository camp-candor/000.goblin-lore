import { describe, it, expect } from 'vitest'
import { CharacterFrontmatterSchema } from '../../26.schema.unit/val/characterFrontmatter.val.js'
import { verifyByteZeroIntegrity } from '../../41.canon.unit/buz/byteZero.buzz.js'
import { verifyHandSaturationSat } from '../../04.logistic.unit/buz/logistic.buzz.js'
import { scanVoiceRailVerbPolarity } from '../../39.verbs.unit/buz/polarityScanner.buzz.js'
import { getCharacterSomaticMask } from '../buz/somaticMask.buzz.js'
import { buildCharacterDossierMarkdown } from '../buz/serializer.buzz.js'

describe('02.character.unit - Local Character Dossier Verification Suite', () => {
    const mockBogFrontmatter = {
        id: 'char_bog',
        name: 'Bog',
        type: 'character' as const,
        status: 'active' as const,
        created_at_epoch: 0,
        somatic: {
            locomotion_baseline: 'bipedal_hunched' as const,
            banned_kinetic_verbs: ['sprint', 'vault', 'leap'],
            conditions: ['cnd_crushed_collarbone'],
            motor_limitations: ['UNSTEADY_GAIT'],
            signature_tics: ['scratches_ear_notch'],
        },
        logistical: {
            worn: ['item_tallow_stained_tunic'],
            held: ['item_iron_knife'],
            carried: ['item_copper_grease_spoon'],
            cached: {},
        },
        epistemic: {
            escalation_ceiling: 3,
            leverage_strings: { char_wart: 2 },
            relationship_defaults: { char_wart: 'distrustful' },
            strings_held_over: ['char_wart'],
        },
        refusal_vectors: [
            {
                refusal_id: 'ref_bog_eye_contact',
                trigger: 'Direct accusation of food theft',
                mandatory_refusal: 'Refuses to make eye contact',
                unavoidable_cost: 'Forfeits his evening grease ration',
                strain_threshold_bps: 8000,
                post_break_state: 'Stammers defensive logistical tallies',
                discovery_provenance_sha256:
                    '7f83cb45a67b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d',
                discovery_take_id: 'TAKE_B',
            },
        ],
        comedic_register: 'hyper_literal' as const,
        risk_profile: {
            disposition: 'CAUTIOUS' as const,
            trigger_condition: 'Unfamiliar boots above the floorboards',
            failure_behavior: 'Retreats into the pipe sleeve',
            shares_pose_with: null,
        },
        pending_showrunner_task: null,
    }

    const mockVoiceRailProse = `
## Wants (surface)
Wants an unblemished copper grease spoon to measure rations accurately.

## Wants (actual)
Fears that if the tally is inaccurate, Mum Grissel will cast him out into the rain culvert.

## Blind spot
Believes that strict adherence to the ledger protects him from physical violence.

## Voice notes
Speaks in clipped, dry phrases with heavy emphasis on quantities, tallies, and weight units.

## Few-shot lines
- "Three ounces of tallow. Not three and a dram. Three."
- "The floorboards groaned twice. That is not the wind."
`.trim()

    it('1. scaffolds Byte-0 compliant Dual-Rail Markdown dossiers with valid schemas', () => {
        // Generate full markdown file buffer
        const markdown = buildCharacterDossierMarkdown(
            mockBogFrontmatter,
            mockVoiceRailProse,
        )
        const buffer = Buffer.from(markdown, 'utf-8')

        // Assert Byte-0 Delimiter Law (0x2D 0x2D 0x2D 0x0A)
        const byteZeroResult = verifyByteZeroIntegrity(buffer)
        expect(byteZeroResult.isValid).toBe(true)
        expect(byteZeroResult.firstFourBytesHex).toBe('2d2d2d0a')

        // Assert Strict Schema Parsing
        const parsed = CharacterFrontmatterSchema.parse(mockBogFrontmatter)
        expect(parsed.id).toBe('char_bog')
        expect(parsed.somatic.locomotion_baseline).toBe('bipedal_hunched')
        expect(parsed.refusal_vectors).toHaveLength(1)
        expect(parsed.refusal_vectors[0].strain_threshold_bps).toBe(8000)
    })

    it('2. Hand Saturation SAT Gate rejects two-handed weapons for single-armed characters', () => {
        // Bog with injured/degraded limb: availableArmsBps = 10000 (1.0 Arm)
        const availableArmsBps = 10000

        // Item requiring two hands: handsRequiredBps = 20000
        const twoHandedCleaver = [
            { id: 'item_grease_cleaver', handsRequiredBps: 20000 },
        ]
        const overAllocatedHeld = verifyHandSaturationSat(
            availableArmsBps,
            twoHandedCleaver,
        )
        expect(overAllocatedHeld.isSatisfiable).toBe(false)
        expect(overAllocatedHeld.errorCode).toBe('HAND_CAPACITY_SAT_VIOLATION')
        expect(overAllocatedHeld.demandedArmsBps).toBe(20000)

        // Item requiring one hand: handsRequiredBps = 10000
        const singleHandKnife = [
            { id: 'item_iron_knife', handsRequiredBps: 10000 },
        ]
        const validHeld = verifyHandSaturationSat(
            availableArmsBps,
            singleHandKnife,
        )
        expect(validHeld.isSatisfiable).toBe(true)
        expect(validHeld.errorCode).toBeUndefined()
        expect(validHeld.demandedArmsBps).toBe(10000)
    })

    it('3. Prose Polarity Scanner halts on affirmative banned verbs but allows negated usage', () => {
        const bannedVerbs = ['sprint', 'vault', 'leap']

        // Negative Control: Affirmative banned verb usage
        const breachedBody = `
## Voice notes
Spleen was terrified. Spleen sprinted across the joists to reach the hatch.
    `.trim()

        const breachResult = scanVoiceRailVerbPolarity(
            'char_spleen',
            'Spleen',
            breachedBody,
            bannedVerbs,
        )
        expect(breachResult.isValid).toBe(false)
        expect(breachResult.errorCode).toBe('FATAL_SOMATIC_POLARITY_BREACH')
        expect(breachResult.offendingVerb).toBe('sprint')

        // Positive Control: Negated usage
        const validBody = `
## Voice notes
Spleen was terrified, but Spleen could not sprint due to his damaged knee.
    `.trim()

        const passResult = scanVoiceRailVerbPolarity(
            'char_spleen',
            'Spleen',
            validBody,
            bannedVerbs,
        )
        expect(passResult.isValid).toBe(true)
        expect(passResult.violations).toHaveLength(0)
    })

    it('4. getCharacterSomaticMask returns deeply frozen immutable projection', () => {
        const registry = new Map()
        registry.set('char_bog', {
            machineRail: mockBogFrontmatter,
            voiceRail: { rawBody: mockVoiceRailProse },
        })

        const mask = getCharacterSomaticMask('char_bog', registry)

        expect(mask.characterId).toBe('char_bog')
        expect(mask.availableArmsBps).toBe(20000)
        expect(mask.locomotionBaseline).toBe('bipedal_hunched')
        expect(mask.bannedKineticVerbs).toContain('sprint')

        // Assert Deep Immutability (Throws TypeError on modification)
        expect(() => {
            ;(mask as any).availableArmsBps = 10000
        }).toThrow(TypeError)

        expect(() => {
            ;(mask.bannedKineticVerbs as any).push('climb')
        }).toThrow(TypeError)

        // Unknown character fails closed immediately
        expect(() => {
            getCharacterSomaticMask('char_nonexistent', registry)
        }).toThrow(/Unknown character ID/)
    })

    it('5. Dual-Rail Character Frontmatter enforces strict schema closure (.strict())', () => {
        const malformed = {
            ...mockBogFrontmatter,
            hallucinated_property: 'illegal_injection',
        }

        expect(() => {
            CharacterFrontmatterSchema.parse(malformed)
        }).toThrow()
    })
})
