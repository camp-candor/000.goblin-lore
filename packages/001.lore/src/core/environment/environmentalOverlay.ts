import Database from 'better-sqlite3'
import {
    EnvironmentalZone,
    EnvironmentalZoneSchema,
    LocomotionEvaluationInput,
} from '../../schemas/environmentalOverlay'

export interface LocomotionEvaluationResult {
    satisfiable: boolean
    effectiveMovementBudget: number
    derivedBannedVerbs: string[]
    errorCode?: 'ENVIRONMENTAL_LOCOMOTION_HALT' | 'DARKNESS_BLINDED_HALT'
    reason?: string
    errorVector?: {
        domain: 'PHYSICAL_ENVIRONMENT'
        target_entity: string
        rule_id: string
        offending_tokens: string[]
    }
}

export interface TransitCostChange {
    changeTick: number
    multiplierBps: number
}

export type TransitFoldingResult =
    | { status: 'COMPLETED'; arrivalTick: number }
    | { status: 'STRANDED'; strandedTick: number; progressBps: number }

export class EnvironmentalFrictionEngine {
    /**
     * Calculates effective movement budget deducted by mud friction basis points:
     * EffectiveBudget = floor(BaseBudget * (10000 - mud_friction_bps) / 10000)
     */
    public static calculateEffectiveMovementBudget(
        baseBudget: number,
        mudFrictionBps: number,
    ): number {
        const clampedFriction = Math.min(10000, Math.max(0, mudFrictionBps))
        const factor = 10000 - clampedFriction
        return Math.floor((baseBudget * factor) / 10000)
    }

    /**
     * Derives dynamic kinetic verb bans from active environmental conditions
     */
    public static deriveBannedVerbs(zone: EnvironmentalZone): string[] {
        const banned: string[] = []

        // Water depth > 50 cm restricts rapid vertical and longitudinal leaping/sprinting
        if (zone.flooded_depth_cm > 50) {
            banned.push('SPRINT', 'VAULT', 'LEAP')
        }

        // Heavy mud friction (> 5000 bps) prevents running
        if (zone.mud_friction_bps > 5000 && !banned.includes('SPRINT')) {
            banned.push('SPRINT')
        }

        return banned
    }

    /**
     * Evaluates locomotion feasibility in a given environmental zone at Stage T0 = $0.00
     */
    public static evaluateLocomotion(
        zone: EnvironmentalZone,
        input: LocomotionEvaluationInput,
    ): LocomotionEvaluationResult {
        // 1. Deep water submersion check (depth > 150 cm halts foot travel completely)
        if (zone.flooded_depth_cm > 150) {
            return {
                satisfiable: false,
                effectiveMovementBudget: 0,
                derivedBannedVerbs: ['ALL_FOOT_LOCOMOTION'],
                errorCode: 'ENVIRONMENTAL_LOCOMOTION_HALT',
                reason: `DEEP_SUBMERSION: Zone '${zone.zone_id}' water depth is ${zone.flooded_depth_cm} cm (>150 cm). Foot travel impassable.`,
                errorVector: {
                    domain: 'PHYSICAL_ENVIRONMENT',
                    target_entity: input.actor_id,
                    rule_id: 'ENVIRONMENTAL_LOCOMOTION_HALT',
                    offending_tokens: [
                        `flooded_depth_cm: ${zone.flooded_depth_cm}`,
                    ],
                },
            }
        }

        // 2. Pitch black darkness restriction
        if (zone.ambient_lux === 0 && !input.has_light_source) {
            const rapidVerbs = input.attempted_verbs.filter((v) =>
                ['SPRINT', 'VAULT', 'LEAP', 'CHARGE'].includes(v.toUpperCase()),
            )

            if (rapidVerbs.length > 0) {
                return {
                    satisfiable: false,
                    effectiveMovementBudget: 0,
                    derivedBannedVerbs: ['SPRINT', 'VAULT', 'LEAP', 'CHARGE'],
                    errorCode: 'DARKNESS_BLINDED_HALT',
                    reason: `PITCH_BLACK_RESTRICTION: Zone '${zone.zone_id}' ambient lux is 0. Rapid locomotion prohibited without light source.`,
                    errorVector: {
                        domain: 'PHYSICAL_ENVIRONMENT',
                        target_entity: input.actor_id,
                        rule_id: 'DARKNESS_BLINDED_HALT',
                        offending_tokens: rapidVerbs,
                    },
                }
            }
        }

        // 3. Dynamic kinetic verb bans check
        const dynamicBanned = this.deriveBannedVerbs(zone)
        const bannedSet = new Set(dynamicBanned)
        const attemptedBanned = input.attempted_verbs.filter((v) =>
            bannedSet.has(v.toUpperCase()),
        )

        if (attemptedBanned.length > 0) {
            return {
                satisfiable: false,
                effectiveMovementBudget: 0,
                derivedBannedVerbs: dynamicBanned,
                errorCode: 'ENVIRONMENTAL_LOCOMOTION_HALT',
                reason: `ENVIRONMENTAL_MOTOR_BREACH: Verbs [${attemptedBanned.join(', ')}] banned by zone '${zone.zone_id}' conditions (water: ${zone.flooded_depth_cm}cm, mud: ${zone.mud_friction_bps}bps).`,
                errorVector: {
                    domain: 'PHYSICAL_ENVIRONMENT',
                    target_entity: input.actor_id,
                    rule_id: 'ENVIRONMENTAL_LOCOMOTION_HALT',
                    offending_tokens: attemptedBanned,
                },
            }
        }

        const effectiveBudget = this.calculateEffectiveMovementBudget(
            input.base_movement_budget,
            zone.mud_friction_bps,
        )

        return {
            satisfiable: true,
            effectiveMovementBudget: effectiveBudget,
            derivedBannedVerbs: dynamicBanned,
        }
    }

    /**
     * Folds piecewise transit cost changes and calculates arrival tick or stranding
     */
    public static foldTransitCostChange(
        departTick: number,
        originalCostUnits: number,
        baseCostUnits: number,
        costChanges: readonly TransitCostChange[],
    ): TransitFoldingResult {
        let currentDepart = departTick
        let currentCost = originalCostUnits

        const sortedChanges = [...costChanges]
            .filter((c) => c.changeTick >= currentDepart)
            .sort((a, b) => a.changeTick - b.changeTick)

        for (const change of sortedChanges) {
            if (change.changeTick >= currentDepart + currentCost) {
                // Journey completed before this change took effect
                break
            }

            const elapsed = change.changeTick - currentDepart
            const progressBps = Math.floor((elapsed * 10000) / currentCost)

            // Impassable zero-multiplier check (e.g., collapsed tunnel, washed-out road)
            if (change.multiplierBps === 0) {
                return {
                    status: 'STRANDED',
                    strandedTick: change.changeTick,
                    progressBps,
                }
            }

            const newCostTotal = Math.floor(
                (baseCostUnits * change.multiplierBps + 5000) / 10000,
            )
            if (newCostTotal <= 0) {
                throw new Error(
                    `Illegal zero cost units resulting from multiplier ${change.multiplierBps}`,
                )
            }

            const remainingOld = currentCost - elapsed
            const remainingNew = Math.ceil(
                (remainingOld * newCostTotal) / currentCost,
            )

            currentDepart = change.changeTick
            currentCost = remainingNew
        }

        return { status: 'COMPLETED', arrivalTick: currentDepart + currentCost }
    }

    /**
     * Persists an environmental zone into local SQLite
     */
    public static persistZoneEnvironment(
        db: Database.Database,
        zone: EnvironmentalZone,
    ): void {
        const validated = EnvironmentalZoneSchema.parse(zone)
        db.exec(`
      CREATE TABLE IF NOT EXISTS environment_zones (
        zone_id TEXT PRIMARY KEY,
        ambient_lux INTEGER NOT NULL CHECK(ambient_lux >= 0),
        flooded_depth_cm INTEGER NOT NULL CHECK(flooded_depth_cm >= 0),
        mud_friction_bps INTEGER NOT NULL CHECK(mud_friction_bps BETWEEN 0 AND 10000),
        airborne_particulate_bps INTEGER NOT NULL CHECK(airborne_particulate_bps BETWEEN 0 AND 10000),
        acoustic_damping_cdb INTEGER NOT NULL CHECK(acoustic_damping_cdb >= 0),
        updated_at_epoch INTEGER NOT NULL DEFAULT 0
      );
    `)

        db.prepare(
            `
      INSERT INTO environment_zones (
        zone_id, ambient_lux, flooded_depth_cm, mud_friction_bps,
        airborne_particulate_bps, acoustic_damping_cdb, updated_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(zone_id) DO UPDATE SET
        ambient_lux = excluded.ambient_lux,
        flooded_depth_cm = excluded.flooded_depth_cm,
        mud_friction_bps = excluded.mud_friction_bps,
        airborne_particulate_bps = excluded.airborne_particulate_bps,
        acoustic_damping_cdb = excluded.acoustic_damping_cdb,
        updated_at_epoch = excluded.updated_at_epoch;
    `,
        ).run(
            validated.zone_id,
            validated.ambient_lux,
            validated.flooded_depth_cm,
            validated.mud_friction_bps,
            validated.airborne_particulate_bps,
            validated.acoustic_damping_cdb,
            validated.updated_at_epoch,
        )
    }
}
