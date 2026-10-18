import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
    evaluatePhysicalOpportunity,
    transducePercept,
    updateBeliefFromPercept,
    sanitizeContextForGeneration,
    verifyCartesianBoundary,
} from '../src/core/cartesian/cartesianFirewall.js'
import { LocalCartesianLedger } from '../src/db/localCartesianLedger.js'
import {
    PhysicalWorldEvent,
    GeneratedExpression,
} from '../schemas/cartesian.js'

describe('The Formal Four-Stage Cartesian Pipeline Contract (F -> G -> H -> J)', () => {
    let ledger: LocalCartesianLedger

    beforeEach(() => {
        ledger = new LocalCartesianLedger(':memory:')
    })

    afterEach(() => {
        ledger.close()
    })

    it('Stage F: enforces spatial physical opportunity independent of belief', () => {
        const validMove = evaluatePhysicalOpportunity(
            'loc_culvert',
            'loc_culvert',
            true,
        )
        expect(validMove.possible).toBe(true)

        const blockedMove = evaluatePhysicalOpportunity(
            'loc_culvert',
            'loc_cistern_vault',
            false,
        )
        expect(blockedMove.possible).toBe(false)
        expect(blockedMove.reason).toContain('PHYSICAL_PATH_BLOCKED')
    })

    it('Stage G: occludes silent physical actions behind opaque barriers', () => {
        const silentKnifeDraw: PhysicalWorldEvent = {
            id: 'event_knife_draw',
            location_id: 'loc_vault',
            initiator_id: 'char_silas',
            action_verb: 'DRAW_WEAPON',
            target_id: 'item_iron_knife',
            sound_power_cb: 0, // Silent action (0 dB)
            optical_signature_lux: 10,
            is_silent: true,
            tick: 1,
        }

        const occludedProfile = {
            wall_damping_cb: 4500, // 45 dB
            ambient_noise_cb: 3000, // 30 dB
            has_direct_line_of_sight: false, // Closed door
        }

        const percept = transducePercept(
            silentKnifeDraw,
            'char_bog',
            'loc_cistern',
            occludedProfile,
            1,
        )

        // Silent action behind closed door produces ZERO percept
        expect(percept).toBeNull()
    })

    it('Stage G: attenuates sound power across walls and detects audible signals', () => {
        const loudCollapse: PhysicalWorldEvent = {
            id: 'event_pipe_burst',
            location_id: 'loc_vault',
            initiator_id: 'char_silas',
            action_verb: 'SMASH',
            sound_power_cb: 9000, // 90 dB loud event
            optical_signature_lux: 0,
            is_silent: false,
            tick: 2,
        }

        const wallProfile = {
            wall_damping_cb: 4000, // 40 dB damping
            ambient_noise_cb: 3000, // 30 dB noise
            has_direct_line_of_sight: false,
        }

        const percept = transducePercept(
            loudCollapse,
            'char_bog',
            'loc_cistern',
            wallProfile,
            2,
        )

        expect(percept).not.toBeNull()
        // Received SNR = 9000 - 4000 - 3000 = 2000 cB (20 dB)
        expect(percept?.received_snr_cb).toBe(2000)
        expect(percept?.modality).toBe('AUDITORY')
    })

    it('Stage H -> J: sanitizes generation context and traps omniscience leaks at T0 = $0.00', () => {
        // 1. Silas draws knife in secret (unperceived by Bog)
        const silentKnifeDraw: PhysicalWorldEvent = {
            id: 'event_silas_knife',
            location_id: 'loc_vault',
            initiator_id: 'char_silas',
            action_verb: 'DRAW_WEAPON',
            target_id: 'item_iron_knife',
            sound_power_cb: 0,
            optical_signature_lux: 0,
            is_silent: true,
            tick: 1,
        }
        ledger.recordPhysicalEvent(silentKnifeDraw)

        // 2. Bog only perceives a dripping pipe in his own room
        const waterDrip: PhysicalWorldEvent = {
            id: 'event_water_drip',
            location_id: 'loc_cistern',
            initiator_id: 'char_environment',
            action_verb: 'DRIP',
            sound_power_cb: 4000,
            optical_signature_lux: 10,
            is_silent: false,
            tick: 1,
        }
        ledger.recordPhysicalEvent(waterDrip)

        const directPercept = transducePercept(
            waterDrip,
            'char_bog',
            'loc_cistern',
            {
                wall_damping_cb: 0,
                ambient_noise_cb: 1000,
                has_direct_line_of_sight: true,
            },
            1,
        )!
        ledger.recordPercept(directPercept)

        const bogBelief = updateBeliefFromPercept(
            directPercept,
            'env_pipe',
            'LEAK',
            'DRIPPING',
        )
        ledger.recordBelief(bogBelief)

        // 3. Verify context envelope scrub: contains only Bog's Stage H belief, zero knife knowledge
        const activeBeliefs = ledger.getActorBeliefs('char_bog')
        const sanitizedContext = sanitizeContextForGeneration(
            'char_bog',
            activeBeliefs,
        )
        expect(sanitizedContext.authorized_knowledge).toHaveLength(1)
        expect(sanitizedContext.authorized_knowledge[0].subject).toBe(
            'env_pipe',
        )

        // 4. Rogue Model Leak Test: Bog claims Silas has drawn a knife
        const rogueExpression: GeneratedExpression = {
            id: 'expr_bog_rogue_01',
            speaker_id: 'char_bog',
            scene_id: 'scene_103',
            expressed_claims: [
                {
                    referenced_entity_id: 'item_iron_knife',
                    claimed_state: 'DRAWN',
                },
            ],
            raw_dialogue_or_blocking:
                'I hear that iron sliding out of your boot, Silas!',
            grounding_belief_ids: [],
            tick: 2,
        }

        const audit = verifyCartesianBoundary(rogueExpression, activeBeliefs)
        expect(audit.valid).toBe(false)
        expect(audit.breach?.rule_id).toBe('CARTESIAN_FIREWALL_BREACH')
        expect(audit.breach?.ungrounded_entities).toContain('item_iron_knife')
    })
})
