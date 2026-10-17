import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    BannedCadenceEnum,
    CharacterVocalProfileSchema,
    VocalTractConditionEnum,
} from '../src/schemas/somaticTrauma.js'
import type {
    CharacterVocalProfile,
    ProposedDialogueLine,
} from '../src/schemas/somaticTrauma.js'
import { VocalFeasibilityEngine } from '../src/linters/vocalFeasibility.js'
import { LocalVocalLedger } from '../src/db/localVocalLedger.js'

describe('Ground-Truth Physical State: Vocal-Motor Feasibility Theorem', () => {
    let ledger: LocalVocalLedger

    beforeEach(() => {
        ledger = new LocalVocalLedger(':memory:')
    })

    afterEach(() => {
        ledger.close()
    })

    it('passes healthy characters with unconstrained vocal tracts', () => {
        const profile: CharacterVocalProfile = {
            character_id: 'char_bog',
            vitality_bps: 10000,
            is_conscious: true,
            active_conditions: [],
            banned_kinetic_verbs: [],
            banned_cadences: [],
            updated_at_epoch: 0,
        }

        const line: ProposedDialogueLine = {
            line_id: 'line_001',
            speaker_id: 'char_bog',
            dialogue_text: 'Hand me the wrench from the culvert floor.',
            observable_parenthetical: 'Squinting through the dark.',
            delivery_cadences: [],
            is_non_verbal_expression: false,
        }

        const result = VocalFeasibilityEngine.evaluateFeasibility(profile, line)
        expect(result.satisfiable).toBe(true)
        expect(result.violatingTokens).toHaveLength(0)
    })

    it('halts with VOCAL_DELIVERY_BREACH when actor has crushed larynx or severed trachea', () => {
        const injuredProfile: CharacterVocalProfile = {
            character_id: 'char_silas',
            vitality_bps: 6000,
            is_conscious: true,
            active_conditions: ['severed_trachea'],
            banned_kinetic_verbs: ['SPEAK'],
            banned_cadences: [],
            updated_at_epoch: 0,
        }

        const line: ProposedDialogueLine = {
            line_id: 'line_002',
            speaker_id: 'char_silas',
            dialogue_text: 'Get out of the drainage pipe now!',
            observable_parenthetical: 'Clutching his shattered throat.',
            delivery_cadences: [],
            is_non_verbal_expression: false,
        }

        const result = VocalFeasibilityEngine.evaluateFeasibility(
            injuredProfile,
            line,
        )
        expect(result.satisfiable).toBe(false)
        expect(result.errorCode).toBe('VOCAL_DELIVERY_BREACH')
        expect(result.violatingTokens).toContain('severed_trachea')
        expect(result.errorVector?.domain).toBe('SOMATIC_VOCAL')
        expect(result.errorVector?.target_entity).toBe('char_silas')
        expect(result.errorVector?.rule_id).toBe('VOCAL_DELIVERY_BREACH')
        expect(result.errorVector?.offending_tokens).toContain(
            'severed_trachea',
        )
    })

    it('permits non-verbal exertion and gasping parentheticals if dialogue text is empty', () => {
        const injuredProfile: CharacterVocalProfile = {
            character_id: 'char_silas',
            vitality_bps: 4000,
            is_conscious: true,
            active_conditions: ['crushed_larynx'],
            banned_kinetic_verbs: ['SPEAK'],
            banned_cadences: [],
            updated_at_epoch: 0,
        }

        const gaspLine: ProposedDialogueLine = {
            line_id: 'line_003',
            speaker_id: 'char_silas',
            dialogue_text: '',
            observable_parenthetical:
                'Gasping violently, air wheezing wetly through clenched teeth.',
            delivery_cadences: [],
            is_non_verbal_expression: true,
        }

        const result = VocalFeasibilityEngine.evaluateFeasibility(
            injuredProfile,
            gaspLine,
        )
        expect(result.satisfiable).toBe(true)
        expect(result.violatingTokens).toHaveLength(0)
    })

    it('halts with POST_MORTEM_VOCAL_BREACH when actor vitality is zero', () => {
        const deceasedProfile: CharacterVocalProfile = {
            character_id: 'char_wart',
            vitality_bps: 0,
            is_conscious: false,
            active_conditions: ['mute'],
            banned_kinetic_verbs: ['SPEAK'],
            banned_cadences: [],
            updated_at_epoch: 0,
        }

        const line: ProposedDialogueLine = {
            line_id: 'line_004',
            speaker_id: 'char_wart',
            dialogue_text: 'I still watch from the shadows.',
            observable_parenthetical: 'Eyes unmoving.',
            delivery_cadences: [],
            is_non_verbal_expression: false,
        }

        const result = VocalFeasibilityEngine.evaluateFeasibility(
            deceasedProfile,
            line,
        )
        expect(result.satisfiable).toBe(false)
        expect(result.errorCode).toBe('POST_MORTEM_VOCAL_BREACH')
        expect(result.errorVector?.rule_id).toBe('POST_MORTEM_VOCAL_BREACH')
    })

    it('halts with PROSODIC_EXCLUSION_BREACH on blacklisted delivery cadences', () => {
        const pulmonaryProfile: CharacterVocalProfile = {
            character_id: 'char_spleen',
            vitality_bps: 8000,
            is_conscious: true,
            active_conditions: ['punctured_lung'],
            banned_kinetic_verbs: [],
            banned_cadences: ['RAPID_STACCATO', 'UPBEAT_LILT'],
            updated_at_epoch: 0,
        }

        const staccatoLine: ProposedDialogueLine = {
            line_id: 'line_005',
            speaker_id: 'char_spleen',
            dialogue_text: 'Quickly! Faster! Keep moving!',
            observable_parenthetical: 'Waving frantically.',
            delivery_cadences: ['RAPID_STACCATO'],
            is_non_verbal_expression: false,
        }

        const result = VocalFeasibilityEngine.evaluateFeasibility(
            pulmonaryProfile,
            staccatoLine,
        )
        expect(result.satisfiable).toBe(false)
        expect(result.errorCode).toBe('PROSODIC_EXCLUSION_BREACH')
        expect(result.violatingTokens).toContain('RAPID_STACCATO')
        expect(result.errorVector?.rule_id).toBe('PROSODIC_EXCLUSION_BREACH')
    })

    it('halts with UNCONSCIOUS_VOCAL_BREACH when actor is unconscious', () => {
        const profile: CharacterVocalProfile = {
            character_id: 'char_bog',
            vitality_bps: 5000,
            is_conscious: false,
            active_conditions: [],
            banned_kinetic_verbs: [],
            banned_cadences: [],
            updated_at_epoch: 0,
        }

        const line: ProposedDialogueLine = {
            line_id: 'line_006',
            speaker_id: 'char_bog',
            dialogue_text: 'I am awake and speaking clearly.',
            observable_parenthetical: 'Eyes closed.',
            delivery_cadences: [],
            is_non_verbal_expression: false,
        }

        const result = VocalFeasibilityEngine.evaluateFeasibility(profile, line)
        expect(result.satisfiable).toBe(false)
        expect(result.errorCode).toBe('UNCONSCIOUS_VOCAL_BREACH')
    })

    it('enforces closed enums, strict schema, and integer basis points', () => {
        expect(VocalTractConditionEnum.options).toContain('mute')
        expect(VocalTractConditionEnum.options).toContain('crushed_larynx')
        expect(VocalTractConditionEnum.options).toContain('severed_trachea')
        expect(VocalTractConditionEnum.options).toContain(
            'bilateral_vocal_cord_paralysis',
        )
        expect(VocalTractConditionEnum.options).toContain('punctured_lung')
        expect(VocalTractConditionEnum.options).toContain('acute_asphyxiation')
        expect(BannedCadenceEnum.options).toContain('RAPID_STACCATO')
        expect(BannedCadenceEnum.options).toContain(
            'RISING_INFLECTION_INTERROGATIVE',
        )
        expect(BannedCadenceEnum.options).toContain('CHEERFUL_MODULATION')
        expect(BannedCadenceEnum.options).toContain('UPBEAT_LILT')
        expect(BannedCadenceEnum.options).toContain('SING_SONG_RESONANCE')

        const parsed = CharacterVocalProfileSchema.parse({
            character_id: 'char_bog',
        })
        expect(parsed.vitality_bps).toBe(10000)
        expect(parsed.is_conscious).toBe(true)
        expect(parsed.updated_at_epoch).toBe(0)

        expect(() =>
            CharacterVocalProfileSchema.parse({
                character_id: 'char_bog',
                vitality_bps: 50.5,
            }),
        ).toThrow()
        expect(() =>
            CharacterVocalProfileSchema.parse({
                character_id: 'char_bog',
                vitality_bps: 10001,
            }),
        ).toThrow()
        expect(() =>
            CharacterVocalProfileSchema.parse({
                character_id: 'char_bog',
                rogue_key: 'UNAUTHORIZED_DATA',
            }),
        ).toThrow()
        expect(() =>
            CharacterVocalProfileSchema.parse({
                character_id: 'char_bog',
                active_conditions: ['not_a_condition'],
            }),
        ).toThrow()
    })

    it('persists and queries vocal profiles in local SQLite with complete fidelity', () => {
        const profile: CharacterVocalProfile = {
            character_id: 'char_silas',
            vitality_bps: 5500,
            is_conscious: true,
            active_conditions: ['crushed_larynx'],
            banned_kinetic_verbs: ['SPEAK', 'SHOUT'],
            banned_cadences: ['RAPID_STACCATO'],
            updated_at_epoch: 100,
        }

        ledger.upsertProfile(profile)
        const retrieved = ledger.getProfile('char_silas')

        expect(retrieved).toBeDefined()
        expect(retrieved?.vitality_bps).toBe(5500)
        expect(retrieved?.active_conditions).toContain('crushed_larynx')
        expect(retrieved?.banned_kinetic_verbs).toContain('SPEAK')
        expect(retrieved?.banned_cadences).toContain('RAPID_STACCATO')
        expect(retrieved?.updated_at_epoch).toBe(100)
        expect(ledger.getProfile('char_nobody')).toBeUndefined()
    })
})
