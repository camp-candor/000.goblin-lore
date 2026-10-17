import { LocalEnvironmentalLedger } from '../db/localEnvironmentalLedger.js'
import { AttemptedOperation } from '../schemas/materialState.js'

export interface FeasibilityAuditResult {
    satisfiable: boolean
    errorCode?:
        | 'MECHANICAL_FAILURE_IMMUTABLE'
        | 'COMBUSTION_IMPOSSIBILITY_HALT'
        | 'ZERO_INTEGRITY_HALT'
        | 'BRITTLE_SHATTER_HALT'
    reason?: string
    spawnedDebrisId?: string
    errorVector?: {
        domain: 'PHYSICAL_MATERIAL'
        target_entity: string
        rule_id: string
        offending_tokens: string[]
    }
}

export interface ImpactDropContext {
    actor_id: string
    item_id: string
    room_id: string
    surface_material: 'STONE' | 'METALLIC' | 'ORGANIC_WOOD' | 'MUD'
    impact_energy_bps: number // 2000 bps is shatter threshold for glass/ceramic
    current_tick: number
}

export class MaterialFeasibilityGate {
    constructor(private ledger: LocalEnvironmentalLedger) {}

    /**
     * Verifies action against active material state stored in local SQLite
     */
    public auditOperation(
        operation: AttemptedOperation,
    ): FeasibilityAuditResult {
        const state = this.ledger.getMaterialState(operation.item_id)
        if (!state) {
            throw new Error(
                `ITEM_NOT_FOUND: Material state for '${operation.item_id}' not found in SQLite.`,
            )
        }

        // 1. Zero Integrity / Inoperable Check
        if (state.structural_integrity_bps === 0 || !state.is_operable) {
            return {
                satisfiable: false,
                errorCode: 'ZERO_INTEGRITY_HALT',
                reason: `DESTROYED_ITEM: Item '${state.item_id}' has 0 structural integrity and cannot be operated.`,
                errorVector: {
                    domain: 'PHYSICAL_MATERIAL',
                    target_entity: state.item_id,
                    rule_id: 'ZERO_INTEGRITY_HALT',
                    offending_tokens: [
                        'structural_integrity_bps: 0',
                        'is_operable: false',
                    ],
                },
            }
        }

        // 2. Mechanical Oxidation Seizure Check (Corrosion > 9000 bps)
        if (
            operation.operation_type === 'OPERATE_MECHANISM' ||
            operation.operation_type === 'PRY_LEVERAGE'
        ) {
            if (
                state.material_class === 'METALLIC' &&
                state.corrosion_bps > 9000
            ) {
                return {
                    satisfiable: false,
                    errorCode: 'MECHANICAL_FAILURE_IMMUTABLE',
                    reason: `OXIDATION_SEIZURE: Metallic item '${state.item_id}' corrosion is ${state.corrosion_bps} bps (>9000 bps). Mechanical operation seized.`,
                    errorVector: {
                        domain: 'PHYSICAL_MATERIAL',
                        target_entity: state.item_id,
                        rule_id: 'MECHANICAL_FAILURE_IMMUTABLE',
                        offending_tokens: [
                            `corrosion_bps: ${state.corrosion_bps}`,
                        ],
                    },
                }
            }
        }

        // 3. Submerged Combustion Check (Wetness > 3000 bps or IMMUNE tier)
        if (operation.operation_type === 'IGNITE') {
            if (
                state.wetness_bps > 3000 ||
                state.combustibility_tier === 'IMMUNE'
            ) {
                return {
                    satisfiable: false,
                    errorCode: 'COMBUSTION_IMPOSSIBILITY_HALT',
                    reason: `COMBUSTION_BLOCKED: Item '${state.item_id}' has wetness of ${state.wetness_bps} bps (>3000 bps) or tier 'IMMUNE'. Ignition impossible.`,
                    errorVector: {
                        domain: 'PHYSICAL_MATERIAL',
                        target_entity: state.item_id,
                        rule_id: 'COMBUSTION_IMPOSSIBILITY_HALT',
                        offending_tokens: [
                            `wetness_bps: ${state.wetness_bps}`,
                            `tier: ${state.combustibility_tier}`,
                        ],
                    },
                }
            }
        }

        return { satisfiable: true }
    }

    /**
     * Evaluates fragile drops, executes shatter dynamics, and spawns room debris shards
     */
    public evaluateImpactDrop(ctx: ImpactDropContext): FeasibilityAuditResult {
        const state = this.ledger.getMaterialState(ctx.item_id)
        if (!state) {
            throw new Error(
                `ITEM_NOT_FOUND: Material state for '${ctx.item_id}' not found in SQLite.`,
            )
        }

        const isBrittle = state.material_class === 'GLASS_CERAMIC'
        const isHardSurface =
            ctx.surface_material === 'STONE' ||
            ctx.surface_material === 'METALLIC'
        const exceedsShatterThreshold = ctx.impact_energy_bps >= 2000

        if (isBrittle && isHardSurface && exceedsShatterThreshold) {
            // Execute atomic shatter & debris spawning in local SQLite
            const debris = this.ledger.breakItemAndSpawnDebris(
                ctx.item_id,
                ctx.room_id,
                ctx.current_tick,
            )

            return {
                satisfiable: false,
                errorCode: 'BRITTLE_SHATTER_HALT',
                spawnedDebrisId: debris.item_id,
                reason: `BRITTLE_SHATTER: Item '${ctx.item_id}' impacted '${ctx.surface_material}' with ${ctx.impact_energy_bps} bps energy. Item shattered into '${debris.item_id}'.`,
                errorVector: {
                    domain: 'PHYSICAL_MATERIAL',
                    target_entity: ctx.item_id,
                    rule_id: 'BRITTLE_SHATTER_HALT',
                    offending_tokens: [
                        `impact_energy_bps: ${ctx.impact_energy_bps}`,
                        `surface: ${ctx.surface_material}`,
                    ],
                },
            }
        }

        return { satisfiable: true }
    }
}
