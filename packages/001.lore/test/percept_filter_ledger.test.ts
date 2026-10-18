import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LocalSensoryLedger } from '../src/db/localSensoryLedger'
import { PerceptFilter } from '../src/core/cartesian/perceptFilter'

describe('Local SQLite Sensory Percept Ledger & Percept Filter', () => {
    let ledger: LocalSensoryLedger
    let filter: PerceptFilter

    beforeEach(() => {
        ledger = new LocalSensoryLedger(':memory:')
        filter = new PerceptFilter(ledger)

        // Seed test profiles
        ledger.upsertSensoryProfile({
            actor_id: 'char_spleen',
            visual_acuity: 'NORMAL',
            hearing_threshold_cdb: 2000,
            has_acoustic_trauma: false,
            facing_direction: 0,
            is_unconscious: false,
        })

        ledger.upsertSensoryProfile({
            actor_id: 'char_bog_blind',
            visual_acuity: 'BLIND',
            hearing_threshold_cdb: 2000,
            has_acoustic_trauma: false,
            facing_direction: 0,
            is_unconscious: false,
        })

        ledger.upsertSensoryProfile({
            actor_id: 'char_wart_monocular',
            visual_acuity: 'MONOCULAR',
            hearing_threshold_cdb: 2000,
            has_acoustic_trauma: false,
            facing_direction: 0, // Facing North
            is_unconscious: false,
        })

        ledger.upsertSensoryProfile({
            actor_id: 'char_concussed',
            visual_acuity: 'NORMAL',
            hearing_threshold_cdb: 2000,
            has_acoustic_trauma: true, // Requires +1,500 cdB
            facing_direction: 0,
            is_unconscious: false,
        })
    })

    afterEach(() => {
        ledger.close()
    })

    it('extinguishes visual percepts for BLIND characters and out-of-facing MONOCULAR characters', () => {
        // 1. Blind character
        const blindCheck = filter.evaluateSensoryReception(
            'char_bog_blind',
            'VISUAL',
            0,
            1,
            5000,
        )
        expect(blindCheck.received).toBe(false)
        expect(blindCheck.reason).toBe('SOMATIC_OPTICAL_BLINDNESS')

        // 2. Monocular character facing North (0) looking at target in North (0) -> passes
        const inCone = filter.evaluateSensoryReception(
            'char_wart_monocular',
            'VISUAL',
            0,
            2,
            5000,
        )
        expect(inCone.received).toBe(true)

        // 3. Monocular character looking at target in South (3) -> blind sector
        const outOfCone = filter.evaluateSensoryReception(
            'char_wart_monocular',
            'VISUAL',
            3,
            2,
            5000,
        )
        expect(outOfCone.received).toBe(false)
        expect(outOfCone.reason).toBe('MONOCULAR_BLIND_SECTOR')
    })

    it('enforces elevated acoustic thresholds for concussed trauma actors', () => {
        // Sound at 2,800 cdB (clears normal 2,000 threshold, but below 3,500 concussed threshold)
        const normal = filter.evaluateSensoryReception(
            'char_spleen',
            'AUDITORY',
            null,
            0,
            2800,
        )
        expect(normal.received).toBe(true)

        const concussed = filter.evaluateSensoryReception(
            'char_concussed',
            'AUDITORY',
            null,
            0,
            2800,
        )
        expect(concussed.received).toBe(false)
        expect(concussed.reason).toBe('BELOW_HEARING_THRESHOLD')

        // Sound at 4,000 cdB clears both
        const loud = filter.evaluateSensoryReception(
            'char_concussed',
            'AUDITORY',
            null,
            0,
            4000,
        )
        expect(loud.received).toBe(true)
    })

    it('scrubs unperceived secret items from generation envelope and halts omniscience drift', () => {
        // Register physical event in secret room
        ledger.recordPhysicalEvent({
            id: 'event_siphon_hide',
            room_id: 'loc_vault',
            initiator_id: 'char_silas',
            action_verb: 'CONCEAL',
            target_id: 'item_brass_siphon',
            sound_power_cdb: 0,
            optical_signature_lux: 0,
            is_silent: true,
            tick: 1,
        })

        // Spleen has ZERO percepts recorded in SQLite
        const envelope = filter.buildSanitizedContextEnvelope(
            'char_spleen',
            'scene_101',
            1,
            ['item_brass_siphon'],
        )

        expect(envelope.forbidden_entities).toContain('item_brass_siphon')
        expect(envelope.authorized_percepts).toHaveLength(0)

        // Draft dialogue where Spleen mentions the siphon
        const rogueBeat = {
            beat_id: 'beat_01',
            speaker_id: 'char_spleen',
            dialogue_text: 'You hid that brass siphon behind the crate, Silas!',
            camera_parenthetical: 'Tense close-up',
            observable_parenthetical: 'Pointing accusatory finger',
            referenced_entities: ['item_brass_siphon'],
        }

        const audit = filter.auditDraftForOmniscience(rogueBeat, envelope)
        expect(audit.valid).toBe(false)
        expect(audit.breachEntity).toBe('item_brass_siphon')
    })

    it('downgrades fine micro-tells to neutral gross blocking when optical quality < 700', () => {
        // Record low-quality percept (distance or steam: quality = 400)
        ledger.recordPhysicalEvent({
            id: 'event_silas_nervous',
            room_id: 'loc_pantry',
            initiator_id: 'char_silas',
            action_verb: 'STAND',
            sound_power_cdb: 0,
            optical_signature_lux: 50,
            is_silent: true,
            tick: 2,
        })

        ledger.recordPercept({
            id: 'percept_01',
            observer_id: 'char_spleen',
            source_event_id: 'event_silas_nervous',
            modality: 'VISUAL',
            perceived_intensity_bps: 4000,
            received_snr_cdb: 2000,
            quality_score: 400, // < 700 threshold
            is_resolved: false,
            apparent_location_id: 'loc_pantry',
            apparent_source_id: 'char_silas',
            tick: 2,
        })

        const beat = {
            beat_id: 'beat_02',
            speaker_id: 'char_silas',
            dialogue_text: 'I was only checking the pressure seals.',
            camera_parenthetical: 'EXTREME CLOSE UP ON SWEAT BEADS',
            observable_parenthetical:
                'Knuckles white and trembling against the iron pipe',
            referenced_entities: [],
        }

        const result = filter.filterDialogueMicroTells(beat, 'char_spleen')
        expect(result.wasDowngraded).toBe(true)
        expect(result.observable_parenthetical).toBe(
            'holding hands low and standing still against the iron pipe',
        )
        // Camera optical layer preserved for Remotion renderers
        expect(result.camera_parenthetical).toBe(
            'EXTREME CLOSE UP ON SWEAT BEADS',
        )
    })
})
