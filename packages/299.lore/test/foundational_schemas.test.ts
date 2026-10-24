import { describe, it, expect } from 'vitest'
import { validateScalarBoundsBuzz } from '../35.threshold.unit/buz/threshold.buzz.js'
import { verifyFrontmatterContractBuzz } from '../26.schema.unit/buz/schema.buzz.js'

describe('Phase 1: Foundational Schema Contracts', () => {
    describe('Task 1.1: Integer Basis-Point Scalar Validator', () => {
        it('accepts valid basis points and scale steps', () => {
            const res = validateScalarBoundsBuzz({
                basis_point_value: 9200,
                escalation_ceiling: 5,
                intensity_score: 3,
            })
            expect(res.success).toBe(true)
            expect(res.code).toBe('OK')
        })

        it('rejects floating-point numbers at T_0 = $0.00', () => {
            const res = validateScalarBoundsBuzz({
                basis_point_value: 9200.5,
                escalation_ceiling: 5,
                intensity_score: 3,
            })
            expect(res.success).toBe(false)
            expect(res.code).toBe('THRESHOLD_BOUNDS_BREACH')
        })

        it('rejects basis points exceeding 10,000', () => {
            const res = validateScalarBoundsBuzz({
                basis_point_value: 10001,
                escalation_ceiling: 5,
                intensity_score: 3,
            })
            expect(res.success).toBe(false)
            expect(res.code).toBe('THRESHOLD_BOUNDS_BREACH')
        })

        it('rejects intensity scores exceeding escalation ceiling', () => {
            const res = validateScalarBoundsBuzz({
                basis_point_value: 5000,
                escalation_ceiling: 3,
                intensity_score: 4,
            })
            expect(res.success).toBe(false)
            expect(res.code).toBe('INTENSITY_EXCEEDS_CEILING')
        })
    })

    describe('Task 1.2: Character Frontmatter Contract', () => {
        const validCharacter = {
            id: 'char_bog',
            type: 'character',
            name: 'Bog',
            status: 'active',
            somatic: {
                arms_available_bp: 10000,
                locomotion_baseline: 'limping',
                motor_limitations: ['paralyzed_left_arm'],
                banned_kinetic_verbs: ['sprint', 'vault'],
            },
            logistical: {
                max_mass_grams: 4500,
                worn_slots: ['belt_scrap'],
                carried_inventory: ['item_iron_knife'],
            },
            epistemic: {
                active_strings_held: ['str_debt_01'],
                conversation_refusal_triggers: ['theft'],
                forbidden_disclosure_tokens: ['secret_cache'],
            },
            created_epoch: 0,
            last_updated_epoch: 0,
        }

        it('validates compliant character frontmatter', () => {
            const report = verifyFrontmatterContractBuzz(
                'character',
                validCharacter,
            )
            expect(report.success).toBe(true)
            expect(report.errors).toHaveLength(0)
        })

        it('rejects character ID failing regex ^char_[a-z0-9_]+$', () => {
            const report = verifyFrontmatterContractBuzz('character', {
                ...validCharacter,
                id: 'character_bog',
            })
            expect(report.success).toBe(false)
            expect(report.errors[0]).toContain('id')
        })

        it('rejects extraneous keys under .strict() closure', () => {
            const report = verifyFrontmatterContractBuzz('character', {
                ...validCharacter,
                extraneous_lore_fact: 'illegal injection',
            })
            expect(report.success).toBe(false)
            expect(report.code).toBe('SCHEMA_VALIDATION_FAILURE')
        })
    })

    describe('Task 1.3: Spatial Location Frontmatter Contract', () => {
        const validLocation = {
            id: 'loc_warm_pipe',
            type: 'location',
            name: 'The Warm Pipe',
            max_adult_goblins: 2,
            acoustic_damping_cdb: 1500,
            ambient_noise_cdb: 450,
            connected_locations: ['loc_attic_stair'],
            dynamic_occluders: [
                {
                    occluder_id: 'hatch_valve_04',
                    default_state: 'SHUT',
                    acoustic_damping_penalty_cdb: 2000,
                },
            ],
            created_epoch: 0,
            last_updated_epoch: 0,
        }

        it('validates compliant location frontmatter', () => {
            const report = verifyFrontmatterContractBuzz(
                'location',
                validLocation,
            )
            expect(report.success).toBe(true)
        })

        it('rejects acoustic damping below 500 cdB floor', () => {
            const report = verifyFrontmatterContractBuzz('location', {
                ...validLocation,
                acoustic_damping_cdb: 400,
            })
            expect(report.success).toBe(false)
            expect(report.errors[0]).toContain('acoustic_damping_cdb')
        })

        it('rejects capacity limits less than 1 goblin', () => {
            const report = verifyFrontmatterContractBuzz('location', {
                ...validLocation,
                max_adult_goblins: 0,
            })
            expect(report.success).toBe(false)
            expect(report.errors[0]).toContain('max_adult_goblins')
        })
    })

    describe('Task 1.4: Tracked Possession Frontmatter Contract', () => {
        const validPossession = {
            id: 'item_tallow_candle',
            type: 'possession',
            name: 'Tallow Candle',
            mass_grams: 45,
            weight_class: 'scrap',
            equip_slot: 'held_primary',
            occupies_hands: 10000,
            custody_holder: 'char_wart',
            created_epoch: 0,
            last_updated_epoch: 0,
        }

        it('validates compliant possession frontmatter', () => {
            const report = verifyFrontmatterContractBuzz(
                'possession',
                validPossession,
            )
            expect(report.success).toBe(true)
        })

        it('rejects invalid occupies_hands basis point values', () => {
            const report = verifyFrontmatterContractBuzz('possession', {
                ...validPossession,
                occupies_hands: 5000, // Not 0, 10000, or 20000
            })
            expect(report.success).toBe(false)
            expect(report.errors[0]).toContain('occupies_hands')
        })

        it('rejects non-positive mass grams', () => {
            const report = verifyFrontmatterContractBuzz('possession', {
                ...validPossession,
                mass_grams: 0,
            })
            expect(report.success).toBe(false)
            expect(report.errors[0]).toContain('mass_grams')
        })
    })

    describe('Task 1.5: Interpersonal Grievance Frontmatter Contract', () => {
        const validGrievance = {
            id: 'grv_pipe_valve_leak',
            type: 'grievance',
            title: 'Pipe Valve Leak Conflict',
            category: 'resource_scarcity',
            participants_primary: ['char_bog', 'char_wart'],
            physical_anchor_prop: 'item_brass_wrench',
            intensity_min: 2,
            intensity_max: 4,
            cooldown_ticks: 60,
            spawns_on_max_escalation: 'grievance:grv_open_brawl',
            created_epoch: 0,
            last_updated_epoch: 0,
        }

        it('validates compliant grievance frontmatter', () => {
            const report = verifyFrontmatterContractBuzz(
                'grievance',
                validGrievance,
            )
            expect(report.success).toBe(true)
        })

        it('rejects reflexive dyadic participant pairs', () => {
            const report = verifyFrontmatterContractBuzz('grievance', {
                ...validGrievance,
                participants_primary: ['char_bog', 'char_bog'],
            })
            expect(report.success).toBe(false)
            expect(report.errors[0]).toContain('participants_primary')
        })

        it('rejects intensity_max smaller than intensity_min', () => {
            const report = verifyFrontmatterContractBuzz('grievance', {
                ...validGrievance,
                intensity_min: 4,
                intensity_max: 2,
            })
            expect(report.success).toBe(false)
            expect(report.errors[0]).toContain('intensity_max')
        })

        it('rejects invalid escalation target namespaces', () => {
            const report = verifyFrontmatterContractBuzz('grievance', {
                ...validGrievance,
                spawns_on_max_escalation: 'unnamespaced_target',
            })
            expect(report.success).toBe(false)
            expect(report.errors[0]).toContain('spawns_on_max_escalation')
        })
    })
})
