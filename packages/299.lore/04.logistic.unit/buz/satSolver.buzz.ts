import { LogisticModel } from '../logistic.model'
import SatSolverBit from '../fce/satSolver.bit'
import State from '../../99.core/state'
import {
    PreflightSatEvaluationInputSchema,
    PreflightSatEvaluationInput,
    LimbState,
} from '../val/satSolver.val'
import {
    SatSolverEvaluationResultBit,
    SatClauseDiagnosticBit,
} from '../fce/satSolver.interface'

/**
 * Pure 7-bit ASCII Telemetry logger helper.
 */
async function emitTelemetry(channel: string, message: string): Promise<void> {
    const lib = (
        globalThis as unknown as {
            LIBRARY?: { hunt: (typ: string, obj: unknown) => Promise<void> }
        }
    ).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        await lib.hunt('[Console action] Update Console', {
            idx: channel,
            src: message,
        })
    }
}

/**
 * Derives operational arm basis points from discrete limb states.
 */
export function getLimbCapacityBps(state: LimbState): number {
    switch (state) {
        case 'INTACT':
            return 10000
        case 'IMPAIRED':
            return 10000 // Impaired can grasp, but triggers motor penalties
        case 'PARALYZED':
        case 'AMPUTATED':
            return 0
    }
}

/**
 * Evaluates the Hand Saturation Pre-Flight SAT Solver at Stage T_0 = $0.00.
 * Performs deterministic combinatorial clause evaluation over upper-limb constraints.
 */
export function evaluatePreflightSat(
    input: PreflightSatEvaluationInput,
): SatSolverEvaluationResultBit {
    const parsed = PreflightSatEvaluationInputSchema.safeParse(input)
    if (!parsed.success) {
        return {
            is_satisfiable: false,
            actor_id: input?.somatic_profile?.actor_id ?? 'char_unknown',
            total_arms_available_bps: 0,
            total_hands_demanded_bps: 0,
            conflict_code: 'HAND_CAPACITY_BREACH',
            clauses: [],
            reason: `SCHEMA_VALIDATION_FAILURE: ${parsed.error.issues[0]?.message ?? 'Invalid SAT input'}`,
        }
    }

    const { somatic_profile, currently_held_items, proposed_action } =
        parsed.data
    const clauses: SatClauseDiagnosticBit[] = []

    // CLAUSE 1: Locomotion Baseline Upper-Limb Exclusion
    const isSessileOrSlithering =
        somatic_profile.locomotion_baseline === 'sessile' ||
        somatic_profile.locomotion_baseline === 'slithering'

    const leftArmAvailableBps = isSessileOrSlithering
        ? 0
        : getLimbCapacityBps(somatic_profile.left_arm_state)
    const rightArmAvailableBps = isSessileOrSlithering
        ? 0
        : getLimbCapacityBps(somatic_profile.right_arm_state)
    const totalArmsAvailableBps = leftArmAvailableBps + rightArmAvailableBps

    clauses.push({
        clause: 'CLAUSE_ANATOMICAL_LIMB_SUPPLY',
        satisfied:
            totalArmsAvailableBps > 0 ||
            proposed_action.occupies_hands_bps === 0,
        demanded_bps: proposed_action.occupies_hands_bps,
        available_bps: totalArmsAvailableBps,
        detail: `Anatomical supply: Left=${leftArmAvailableBps} bps, Right=${rightArmAvailableBps} bps (Total=${totalArmsAvailableBps} bps)`,
    })

    // CLAUSE 2: Kinetic Verb Intersection
    const bannedSet = new Set(
        somatic_profile.banned_kinetic_verbs.map((v) => v.toLowerCase().trim()),
    )
    const violatedVerbs = proposed_action.required_kinetic_verbs.filter((v) =>
        bannedSet.has(v.toLowerCase().trim()),
    )

    if (violatedVerbs.length > 0) {
        clauses.push({
            clause: 'CLAUSE_KINETIC_MOTOR_PERMISSIBILITY',
            satisfied: false,
            demanded_bps: proposed_action.occupies_hands_bps,
            available_bps: totalArmsAvailableBps,
            detail: `Action demands banned verbs: [${violatedVerbs.join(', ')}]`,
        })

        return {
            is_satisfiable: false,
            actor_id: somatic_profile.actor_id,
            total_arms_available_bps: totalArmsAvailableBps,
            total_hands_demanded_bps: proposed_action.occupies_hands_bps,
            conflict_code: 'KINETIC_MOTOR_BREACH',
            clauses,
            reason: `KINETIC_MOTOR_BREACH: Entity attempted banned motor verbs [${violatedVerbs.join(', ')}]`,
        }
    }

    // CLAUSE 3: Total Gross Hand Demand Inequality
    let existingOccupiedBps = 0
    let leftOccupied = false
    let rightOccupied = false

    for (const item of currently_held_items) {
        existingOccupiedBps += item.occupies_hands_bps
        if (item.equipped_arm === 'LEFT') leftOccupied = true
        if (item.equipped_arm === 'RIGHT') rightOccupied = true
    }

    const totalDemandBps =
        existingOccupiedBps + proposed_action.occupies_hands_bps

    const grossCapacitySatisfied = totalDemandBps <= totalArmsAvailableBps
    clauses.push({
        clause: 'CLAUSE_GROSS_HAND_CAPACITY_INEQUALITY',
        satisfied: grossCapacitySatisfied,
        demanded_bps: totalDemandBps,
        available_bps: totalArmsAvailableBps,
        detail: `Gross inequality: sum(demanded)=${totalDemandBps} bps <= available=${totalArmsAvailableBps} bps`,
    })

    if (!grossCapacitySatisfied) {
        return {
            is_satisfiable: false,
            actor_id: somatic_profile.actor_id,
            total_arms_available_bps: totalArmsAvailableBps,
            total_hands_demanded_bps: totalDemandBps,
            conflict_code: 'HAND_CAPACITY_BREACH',
            clauses,
            reason: `HAND_CAPACITY_BREACH: Demanded ${totalDemandBps} bps hands but actor only possesses ${totalArmsAvailableBps} bps capacity`,
        }
    }

    // CLAUSE 4: Combinatorial Per-Limb & Handedness Satisfiability
    if (
        proposed_action.occupies_hands === 2 ||
        proposed_action.demanded_handedness === 'BIMANUAL'
    ) {
        const bimanualPossible =
            leftArmAvailableBps === 10000 &&
            rightArmAvailableBps === 10000 &&
            !leftOccupied &&
            !rightOccupied

        clauses.push({
            clause: 'CLAUSE_BIMANUAL_DUAL_ARM_REQUIREMENT',
            satisfied: bimanualPossible,
            demanded_bps: 20000,
            available_bps: totalArmsAvailableBps,
            detail: `Bimanual dual-arm verification: LeftFree=${!leftOccupied && leftArmAvailableBps === 10000}, RightFree=${!rightOccupied && rightArmAvailableBps === 10000}`,
        })

        if (!bimanualPossible) {
            return {
                is_satisfiable: false,
                actor_id: somatic_profile.actor_id,
                total_arms_available_bps: totalArmsAvailableBps,
                total_hands_demanded_bps: totalDemandBps,
                conflict_code: 'BIMANUAL_CAPACITY_BREACH',
                clauses,
                reason: `BIMANUAL_CAPACITY_BREACH: Bimanual action requires two functional, unencumbered arms`,
            }
        }
    } else if (proposed_action.demanded_handedness === 'LEFT') {
        const leftArmViable = leftArmAvailableBps === 10000 && !leftOccupied
        clauses.push({
            clause: 'CLAUSE_DISCRETE_LEFT_ARM_AVAILABILITY',
            satisfied: leftArmViable,
            demanded_bps: 10000,
            available_bps: leftArmAvailableBps,
            detail: `Discrete left arm viability: Available=${leftArmAvailableBps === 10000}, Free=${!leftOccupied}`,
        })

        if (!leftArmViable) {
            return {
                is_satisfiable: false,
                actor_id: somatic_profile.actor_id,
                total_arms_available_bps: totalArmsAvailableBps,
                total_hands_demanded_bps: totalDemandBps,
                conflict_code: 'PER_LIMB_AMPUTATION_BREACH',
                clauses,
                reason: `PER_LIMB_AMPUTATION_BREACH: Left arm is unavailable or encumbered for requested left-handed action`,
            }
        }
    } else if (proposed_action.demanded_handedness === 'RIGHT') {
        const rightArmViable = rightArmAvailableBps === 10000 && !rightOccupied
        clauses.push({
            clause: 'CLAUSE_DISCRETE_RIGHT_ARM_AVAILABILITY',
            satisfied: rightArmViable,
            demanded_bps: 10000,
            available_bps: rightArmAvailableBps,
            detail: `Discrete right arm viability: Available=${rightArmAvailableBps === 10000}, Free=${!rightOccupied}`,
        })

        if (!rightArmViable) {
            return {
                is_satisfiable: false,
                actor_id: somatic_profile.actor_id,
                total_arms_available_bps: totalArmsAvailableBps,
                total_hands_demanded_bps: totalDemandBps,
                conflict_code: 'PER_LIMB_AMPUTATION_BREACH',
                clauses,
                reason: `PER_LIMB_AMPUTATION_BREACH: Right arm is unavailable or encumbered for requested right-handed action`,
            }
        }
    }

    return {
        is_satisfiable: true,
        actor_id: somatic_profile.actor_id,
        total_arms_available_bps: totalArmsAvailableBps,
        total_hands_demanded_bps: totalDemandBps,
        conflict_code: 'NONE',
        clauses,
    }
}

export const evaluatePreflightSatBuzz = async (
    cpy: LogisticModel,
    bal: SatSolverBit<PreflightSatEvaluationInput>,
    ste: State,
) => {
    if (!bal.dat) {
        if (bal.slv) bal.slv({ satBit: { idx: bal.idx, val: 0 } })
        return cpy
    }

    const result = evaluatePreflightSat(bal.dat)

    if (!result.is_satisfiable) {
        await emitTelemetry(
            'cns00',
            `:: [PREFLIGHT_SAT_FAIL] Actor ${result.actor_id}: ${result.conflict_code} -> ${result.reason}`,
        )
    } else {
        await emitTelemetry(
            'cns00',
            `>> [PREFLIGHT_SAT_PASS] Actor ${result.actor_id}: Satisfiable (${result.total_hands_demanded_bps} <= ${result.total_arms_available_bps} bps) [OK]`,
        )
    }

    if (bal.slv) {
        bal.slv({
            satBit: {
                idx: bal.idx,
                val: result.is_satisfiable ? 1 : 0,
                dat: result,
            },
        })
    }
    return cpy
}
