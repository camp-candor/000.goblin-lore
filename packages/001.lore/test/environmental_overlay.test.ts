import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import Database from 'better-sqlite3'
import {
    EnvironmentalZoneSchema,
    EnvironmentalZone,
    LocomotionEvaluationInput,
} from '../src/schemas/environmentalOverlay'
import { EnvironmentalFrictionEngine } from '../src/core/environment/environmentalOverlay'

describe('Ground-Truth Physical State: Dynamic Environmental Overlay & Friction Engine', () => {
    let db: Database.Database

    beforeEach(() => {
        db = new Database(':memory:')
    })

    afterEach(() => {
        db.close()
    })

    it('enforces strict schema validation rejecting non-conforming IDs and negative values', () => {
        const invalidZone = {
            zone_id: 'invalid_prefix_zone',
            ambient_lux: -10, // Invalid negative
            flooded_depth_cm: 20,
            mud_friction_bps: 12000, // Out of basis point range
        }
        expect(() => EnvironmentalZoneSchema.parse(invalidZone)).toThrow()
    })

    it('calculates effective movement budget deducted by mud friction basis points', () => {
        const baseBudget = 100
        const halfFrictionBps = 5000 // 50% friction
        const effective =
            EnvironmentalFrictionEngine.calculateEffectiveMovementBudget(
                baseBudget,
                halfFrictionBps,
            )
        expect(effective).toBe(50)

        const totalFriction =
            EnvironmentalFrictionEngine.calculateEffectiveMovementBudget(
                baseBudget,
                10000,
            )
        expect(totalFriction).toBe(0)
    })

    it('dynamically bans SPRINT, VAULT, and LEAP when standing water exceeds 50 cm', () => {
        const floodedZone: EnvironmentalZone = {
            zone_id: 'loc_culvert_lower',
            ambient_lux: 400,
            flooded_depth_cm: 65, // > 50 cm
            mud_friction_bps: 2000,
            airborne_particulate_bps: 100,
            acoustic_damping_cdb: 50,
            updated_at_epoch: 0,
        }

        const inputSprint: LocomotionEvaluationInput = {
            actor_id: 'char_silas',
            base_movement_budget: 80,
            attempted_verbs: ['SPRINT'],
            has_light_source: true,
        }

        const result = EnvironmentalFrictionEngine.evaluateLocomotion(
            floodedZone,
            inputSprint,
        )
        expect(result.satisfiable).toBe(false)
        expect(result.errorCode).toBe('ENVIRONMENTAL_LOCOMOTION_HALT')
        expect(result.derivedBannedVerbs).toContain('SPRINT')
        expect(result.derivedBannedVerbs).toContain('VAULT')
        expect(result.errorVector?.rule_id).toBe(
            'ENVIRONMENTAL_LOCOMOTION_HALT',
        )

        // Normal walking passes with deducted budget
        const inputWalk: LocomotionEvaluationInput = {
            actor_id: 'char_silas',
            base_movement_budget: 100,
            attempted_verbs: ['WADE'],
            has_light_source: true,
        }
        const resultWalk = EnvironmentalFrictionEngine.evaluateLocomotion(
            floodedZone,
            inputWalk,
        )
        expect(resultWalk.satisfiable).toBe(true)
        expect(resultWalk.effectiveMovementBudget).toBe(80) // 100 * (10000 - 2000) / 10000 = 80
    })

    it('halts walking completely when standing water exceeds 150 cm', () => {
        const deepZone: EnvironmentalZone = {
            zone_id: 'loc_reservoir_sump',
            ambient_lux: 300,
            flooded_depth_cm: 180, // > 150 cm deep water
            mud_friction_bps: 1000,
            airborne_particulate_bps: 0,
            acoustic_damping_cdb: 0,
            updated_at_epoch: 0,
        }

        const input: LocomotionEvaluationInput = {
            actor_id: 'char_bog',
            base_movement_budget: 100,
            attempted_verbs: ['WALK'],
            has_light_source: true,
        }

        const result = EnvironmentalFrictionEngine.evaluateLocomotion(
            deepZone,
            input,
        )
        expect(result.satisfiable).toBe(false)
        expect(result.errorCode).toBe('ENVIRONMENTAL_LOCOMOTION_HALT')
        expect(result.reason).toContain('DEEP_SUBMERSION')
    })

    it('halts rapid locomotion in pitch black darkness without light source', () => {
        const darkZone: EnvironmentalZone = {
            zone_id: 'loc_dark_mine',
            ambient_lux: 0, // Pitch black
            flooded_depth_cm: 0,
            mud_friction_bps: 0,
            airborne_particulate_bps: 0,
            acoustic_damping_cdb: 0,
            updated_at_epoch: 0,
        }

        const unlitInput: LocomotionEvaluationInput = {
            actor_id: 'char_wart',
            base_movement_budget: 100,
            attempted_verbs: ['SPRINT'],
            has_light_source: false, // Blinded
        }

        const result = EnvironmentalFrictionEngine.evaluateLocomotion(
            darkZone,
            unlitInput,
        )
        expect(result.satisfiable).toBe(false)
        expect(result.errorCode).toBe('DARKNESS_BLINDED_HALT')
        expect(result.errorVector?.rule_id).toBe('DARKNESS_BLINDED_HALT')

        // Lit sprint passes
        const litInput: LocomotionEvaluationInput = {
            ...unlitInput,
            has_light_source: true,
        }
        const litResult = EnvironmentalFrictionEngine.evaluateLocomotion(
            darkZone,
            litInput,
        )
        expect(litResult.satisfiable).toBe(true)
    })

    it('folds piecewise transit cost changes and halts on zero-multiplier impassable washout', () => {
        const baseCost = 1000 // Centiseconds
        const departTick = 100

        // Normal flood multiplier increases remaining duration
        const resultNormal = EnvironmentalFrictionEngine.foldTransitCostChange(
            departTick,
            baseCost,
            baseCost,
            [{ changeTick: 500, multiplierBps: 20000 }], // At 50% progress, cost doubles (2.0x)
        )

        // Progress at 500: (500 - 100) / 1000 = 40% elapsed (400 cs). Remaining old = 600 cs.
        // New cost total = 1000 * 2.0 = 2000 cs.
        // Remaining new = ceil(600 * 2000 / 1000) = 1200 cs.
        // Arrival: 500 + 1200 = 1700 cs.
        expect(resultNormal).toEqual({ status: 'COMPLETED', arrivalTick: 1700 })

        // Road washout (multiplier = 0) halts actor immediately
        const resultWashout = EnvironmentalFrictionEngine.foldTransitCostChange(
            departTick,
            baseCost,
            baseCost,
            [{ changeTick: 400, multiplierBps: 0 }],
        )
        expect(resultWashout).toEqual({
            status: 'STRANDED',
            strandedTick: 400,
            progressBps: 3000, // 300 / 1000 = 30%
        })
    })

    it('persists and queries environmental zone in local SQLite with complete parity', () => {
        const zone: EnvironmentalZone = {
            zone_id: 'loc_sluice_junction',
            ambient_lux: 150,
            flooded_depth_cm: 45,
            mud_friction_bps: 3500,
            airborne_particulate_bps: 1200,
            acoustic_damping_cdb: 300,
            updated_at_epoch: 500,
        }

        EnvironmentalFrictionEngine.persistZoneEnvironment(db, zone)

        const row = db
            .prepare('SELECT * FROM environment_zones WHERE zone_id = ?')
            .get('loc_sluice_junction') as {
            zone_id: string
            ambient_lux: number
            flooded_depth_cm: number
            mud_friction_bps: number
            airborne_particulate_bps: number
            acoustic_damping_cdb: number
            updated_at_epoch: number
        }

        expect(row).toBeDefined()
        expect(row.ambient_lux).toBe(150)
        expect(row.flooded_depth_cm).toBe(45)
        expect(row.mud_friction_bps).toBe(3500)
        expect(row.acoustic_damping_cdb).toBe(300)
    })
})
