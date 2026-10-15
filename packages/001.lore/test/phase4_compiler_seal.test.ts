import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import {
    canonicalizeJson,
    computeMerkleRoot,
    verifyStateMerkleParity,
} from '../src/core/canon/merkleVerifier.js'
import { deepFreeze, loadBibleState } from '../src/core/canon/bibleLoader.js'
import { ThreePassCompiler } from '../scripts/compile.js'
import { Grievance } from '../src/schemas/grievance.js'
import { Character, Location } from '../src/schemas/entities.js'

describe('Phase 4: JCS Canonicalization, Compiler Gauntlet & Merkle Sealing', () => {
    describe('JCS Canonicalization (RFC 8785)', () => {
        it('should sort keys lexicographically by UTF-16 code units', () => {
            const input = { b: 2, a: 1, c: 3 }
            const expected = '{"a":1,"b":2,"c":3}'
            expect(canonicalizeJson(input)).toBe(expected)
        })

        it('should apply Unicode Normalization Form C (NFC)', () => {
            const input = { a: 'e\u0301' } // e + acute accent
            const expected = '{"a":"\u00E9"}'
            expect(canonicalizeJson(input)).toBe(expected)
        })

        it('should reject non-finite numbers', () => {
            expect(() => canonicalizeJson({ a: NaN })).toThrow(TypeError)
            expect(() => canonicalizeJson({ a: Infinity })).toThrow(TypeError)
        })

        it('should format whitespace deterministically', () => {
            const input = { a: 1, b: 2 }
            const expected = '{"a":1,"b":2}'
            expect(canonicalizeJson(input)).toBe(expected)
        })
    })

    describe('deepFreeze', () => {
        it('should recursively freeze objects', () => {
            const obj = { a: 1, b: { c: 2 }, d: [1, 2, 3] }
            const frozen = deepFreeze(obj)

            expect(Object.isFrozen(frozen)).toBe(true)
            expect(Object.isFrozen(frozen.b)).toBe(true)
            expect(Object.isFrozen(frozen.d)).toBe(true)

            expect(() => {
                ;(frozen as any).a = 2
            }).toThrow(TypeError)
            expect(() => {
                ;(frozen.b as any).c = 3
            }).toThrow(TypeError)
            expect(() => {
                ;(frozen.d as any).push(4)
            }).toThrow(TypeError)
        })
    })

    describe('Level 3: Adversarial Negative-Control Traps', () => {
        let tempDir: string
        let compiledDir: string

        beforeEach(() => {
            tempDir = path.join(__dirname, '.tmp_test_data')
            compiledDir = path.join(__dirname, '.tmp_compiled')

            fs.mkdirSync(tempDir, { recursive: true })
            fs.mkdirSync(compiledDir, { recursive: true })
        })

        afterEach(() => {
            fs.rmSync(tempDir, { recursive: true, force: true })
            fs.rmSync(compiledDir, { recursive: true, force: true })
        })

        it('Trap 1: Key-Order Invariance Trap (RFC 8785 Compliance)', () => {
            const payloadA = { b: 2, a: 1 }
            const payloadB = { a: 1, b: 2 }

            const canonicalA = canonicalizeJson(payloadA)
            const canonicalB = canonicalizeJson(payloadB)

            expect(canonicalA).toBe('{"a":1,"b":2}')
            expect(canonicalB).toBe('{"a":1,"b":2}')
            expect(computeMerkleRoot(canonicalA)).toBe(
                computeMerkleRoot(canonicalB),
            )
        })

        it('Trap 2: Circular Grievance Escalation Trap (3-Color DFS Cycle Detection)', () => {
            const compiler = new ThreePassCompiler()

            const grvA: Grievance = {
                id: 'grv_feud_a',
                title: 'Dispute A',
                category: 'resource_hoarding',
                participants_primary: ['char_bog', 'char_wart'],
                secondary_stakeholders: [],
                intensity_envelope: { min: 1, max: 3 },
                cooldown_cycles: 1,
                spawns_on_max_escalation: ['grv_feud_b'],
                tonal_override_eligible: false,
                associated_props: [],
                associated_locations: [],
            }

            const grvB: Grievance = {
                id: 'grv_feud_b',
                title: 'Dispute B',
                category: 'resource_hoarding',
                participants_primary: ['char_wart', 'char_bog'],
                secondary_stakeholders: [],
                intensity_envelope: { min: 1, max: 3 },
                cooldown_cycles: 1,
                spawns_on_max_escalation: ['grv_feud_a'], // Circular: A -> B -> A
                tonal_override_eligible: false,
                associated_props: [],
                associated_locations: [],
            }

            compiler.grievances.set('grv_feud_a', grvA)
            compiler.grievances.set('grv_feud_b', grvB)

            expect(() => compiler.executePass2()).toThrow(
                /COMPILER_DAG_CYCLE: Circular grievance escalation detected/,
            )
        })

        it('Trap 3: Dangling Foreign-Key Trap (Pass 2 Integrity Sweep)', () => {
            const compiler = new ThreePassCompiler()

            const ghostChar: Character = {
                type: 'character',
                status: 'active',
                historical_reference: false,
                linked_possessions: [],
                somatic: { somatic_capability_mask: 0xffffffff, available_arms: 2, locomotion_baseline: 'bipedal_standard', conditions: [], motor_limitations: [], signature_tics: [], banned_kinetic_verbs: [] },
                id: 'char_ghost_walker',
                name: 'Ghost Walker',
                location: 'loc_ghost_room', // Unknown location
                logistical: { worn: [], held: [], carried: [], cached: [] },
                epistemic: { escalation_ceiling: 3, leverage_strings: {}, relationship_defaults: {}, strings_held_over: [], known_secret_ids: [], banned_attenuation_tokens: [] },
                linked_grievances: [],
            }

            compiler.characters.set(ghostChar.id, ghostChar)

            expect(() => compiler.executePass2()).toThrow(/COMPILER_FK_ERROR/)
        })

        it('Trap 4: Asymmetric Spatial Portal Trap (One-Way Trap Sweep)', () => {
            const compiler = new ThreePassCompiler()

            const locA: Location = {
                type: 'location',
                status: 'active',
                historical_reference: false,
                linked_grievances: [],
                linked_possessions: [],
                participants: [],
                lighting_level: 'dim',
                id: 'loc_room_a',
                name: 'Room A',
                acoustic_damping_bp: 1000,
                connected_locations: ['loc_room_b'],
            }
            const locB: Location = {
                type: 'location',
                status: 'active',
                historical_reference: false,
                linked_grievances: [],
                linked_possessions: [],
                participants: [],
                lighting_level: 'dim',
                id: 'loc_room_b',
                name: 'Room B',
                acoustic_damping_bp: 1000,
                connected_locations: [], // Asymmetric missing return link
            }

            compiler.locations.set(locA.id, locA)
            compiler.locations.set(locB.id, locB)

            expect(() => compiler.executePass2()).toThrow(
                /COMPILER_SPATIAL_ERROR/,
            )
        })

        it('Trap 5: Single-Byte Payload Tamper Detection Trap', () => {
            const rawValidPayload = {
                characters: {},
                locations: {},
                possessions: {},
                grievances: {},
                _meta: { version: '1.0.0' },
            }
            const canonical = canonicalizeJson(rawValidPayload)
            const hRoot = computeMerkleRoot(canonical)

            // Mutate a single character in serialized state
            const validStateJson = JSON.stringify({
                ...rawValidPayload,
                _meta: { version: '1.0.0', state_hash: hRoot },
            })
            expect(verifyStateMerkleParity(validStateJson, hRoot)).toBe(true)

            // Tamper single byte: version '1.0.0' -> '1.0.1'
            const tamperedJson = validStateJson.replace('1.0.0', '1.0.1')
            expect(verifyStateMerkleParity(tamperedJson, hRoot)).toBe(false)
        })

        it('Trap 6: Runtime State Mutation Trap (deepFreeze Immutability)', () => {
            const compiler = new ThreePassCompiler()
            const charBog: Character = {
                type: 'character',
                status: 'active',
                historical_reference: false,
                linked_possessions: [],
                somatic: { somatic_capability_mask: 0xffffffff, available_arms: 2, locomotion_baseline: 'bipedal_standard', conditions: [], motor_limitations: [], signature_tics: [], banned_kinetic_verbs: [] },
                id: 'char_bog',
                name: 'Bog',
                location: undefined,
                logistical: { worn: [], held: [], carried: [], cached: [] },
                epistemic: { escalation_ceiling: 3, leverage_strings: {}, relationship_defaults: {}, strings_held_over: [], known_secret_ids: [], banned_attenuation_tokens: [] },
                linked_grievances: [],
            }
            compiler.characters.set(charBog.id, charBog)
            compiler.executePass3(compiledDir, 'canon')

            const headPath = path.join(compiledDir, 'canon', 'bible-state.json')
            const state = loadBibleState(headPath)

            expect(() => {
                ;(state.characters.char_bog as any).name = 'MutatedName'
            }).toThrow(TypeError)
        })
    })
})
