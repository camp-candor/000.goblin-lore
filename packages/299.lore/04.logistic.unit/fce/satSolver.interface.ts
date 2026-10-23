import {
    PreflightSatEvaluationInput,
    LimbState,
    Handedness,
} from '../val/satSolver.val'

export interface SatClauseDiagnosticBit {
    readonly clause: string
    readonly satisfied: boolean
    readonly demanded_bps: number
    readonly available_bps: number
    readonly detail: string
}

export interface SatSolverEvaluationResultBit {
    readonly is_satisfiable: boolean
    readonly actor_id: string
    readonly total_arms_available_bps: number
    readonly total_hands_demanded_bps: number
    readonly conflict_code:
        | 'NONE'
        | 'HAND_CAPACITY_BREACH'
        | 'PER_LIMB_AMPUTATION_BREACH'
        | 'BIMANUAL_CAPACITY_BREACH'
        | 'KINETIC_MOTOR_BREACH'
    readonly clauses: readonly SatClauseDiagnosticBit[]
    readonly reason?: string
}

export default interface SatSolver {
    idx: string
    history: SatSolverEvaluationResultBit[]
}
