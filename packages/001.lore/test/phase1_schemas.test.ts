import { describe, it, expect } from 'vitest'
import {
    CharacterSchema,
    PossessionSchema,
    LocationSchema,
    Character,
    Possession,
} from '../src/schemas/entities.js'
import {
    buildByteZeroDossier,
    verifyByteZeroIntegrity,
} from '../src/scaffolder/entityBuilder.js'
import { evaluateSomaticSAT } from '../src/scaffolder/satSolver.js'

describe('Phase 1: Byte-0 & Tri-Partite Vector Invariants', () => {
    it('enforces Byte-0 Frontmatter Law on serialized dossiers', () => {
        const frontmatter = {
            id: 'char_bog',
            name: 'Bog',
            type: 'character',
            somatic: {
                locomotion_baseline: 'bipedal_standard',
                available_arms: 2,
                banned_kinetic_verbs: ['sprint'],
            },
            logistical: { worn: [], held: [], carried: [], cached: [] },
            epistemic: { escalation_ceiling: 3, strings_held_over: [] },
        }

        const voice = {
            wantsSurface: 'Argues over cleaning the silver spoon.',
            wantsActual: 'Desperately seeking unearned absolution.',
            blindSpot: 'Cannot admit complicity in the pantry leak.',
            voiceNotes: 'Raspy, punctuated by wet coughs.',
        }

        const dossier = buildByteZeroDossier(frontmatter, voice)
        const integrity = verifyByteZeroIntegrity(dossier)
        expect(integrity.valid).toBe(true)

        const buf = Buffer.from(dossier, 'utf8')
        expect(buf[0]).toBe(0x2d)
        expect(buf[1]).toBe(0x2d)
        expect(buf[2]).toBe(0x2d)
        expect(buf[3]).toBe(0x0a)
    })

    it('rejects files contaminated with UTF-8 BOM or leading whitespace', () => {
        const bomPayload = Buffer.concat([
            Buffer.from([0xef, 0xbb, 0xbf]),
            Buffer.from('---\nid: char_test\n---'),
        ])
        expect(verifyByteZeroIntegrity(bomPayload).valid).toBe(false)

        const whitespacePayload = '   ---\nid: char_test\n---'
        expect(verifyByteZeroIntegrity(whitespacePayload).valid).toBe(false)
    })

    it('fails Zod validation when un-schemaed keys are injected (.strict() fence)', () => {
        const invalidCharacter = {
            id: 'char_wart',
            name: 'Wart',
            type: 'character',
            somatic: {
                locomotion_baseline: 'limping',
                hallucinated_property: 'ILLEGAL_KEY',
            },
            logistical: {},
            epistemic: {},
        }

        const result = CharacterSchema.safeParse(invalidCharacter)
        expect(result.success).toBe(false)
    })

    it('detects Somatic SAT breach when hand capacity is exceeded', () => {
        const character: Character = {
            id: 'char_wart',
            name: 'Wart',
            type: 'character',
            status: 'active',
            historical_reference: false,
            somatic: {
                somatic_capability_mask: 0xffffffff,
                available_arms: 1, // Only 1 functional arm
                locomotion_baseline: 'bipedal_standard',
                banned_kinetic_verbs: [],
                conditions: ['severed_left_arm'],
                motor_limitations: [],
                signature_tics: [],
            },
            logistical: {
                worn: [],
                held: ['item_heavy_siphon'],
                carried: [],
                cached: [],
            },
            epistemic: {
                escalation_ceiling: 3,
                leverage_strings: {},
                relationship_defaults: {},
                strings_held_over: [],
                known_secret_ids: [],
                banned_attenuation_tokens: [],
            },
            linked_grievances: [],
            linked_possessions: [],
        }

        const twoHandedSiphon: Possession = {
            id: 'item_heavy_siphon',
            name: 'Fuel Siphon',
            type: 'possession',
            status: 'active',
            historical_reference: false,
            contested_by: [],
            logistical: {
                is_contested: false,
                weight_class: 'heavy',
                occupies_hands: 2, // Demands 2 hands
                mass_grams: 4500,
            },
        }

        const catalog = new Map<string, Possession>()
        catalog.set(twoHandedSiphon.id, twoHandedSiphon)

        const sat = evaluateSomaticSAT(character, catalog)
        expect(sat.passed).toBe(false)
        expect(sat.code).toBe('SOMATIC_SAT_BREACH')
        expect(sat.armsDemanded).toBe(2)
        expect(sat.armsAvailable).toBe(0) // 1 baseline arm - 1 arm condition penalty = 0
    })
})
