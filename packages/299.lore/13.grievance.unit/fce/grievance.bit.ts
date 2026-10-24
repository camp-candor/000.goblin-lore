export type ThematicCategory =
    | 'resource_scarcity'
    | 'status_humiliation'
    | 'territory_breach'
    | 'broken_obligation'
    | 'somatic_injury'
    | 'paranoia_suspicion'
    | 'contraband_theft'

export interface GrievanceFrontmatterBit {
    readonly id: string
    readonly type: 'grievance'
    readonly title: string
    readonly category: ThematicCategory
    readonly participants_primary: readonly [string, string]
    readonly physical_anchor_prop: string
    readonly intensity_min: number
    readonly intensity_max: number
    readonly cooldown_ticks: number
    readonly spawns_on_max_escalation?: string
    readonly created_epoch: number
    readonly last_updated_epoch: number
}

export default interface GrievanceBit {
    idx: string
    src?: string
    val?: number
    dat?: any
    slv?: Function
}
