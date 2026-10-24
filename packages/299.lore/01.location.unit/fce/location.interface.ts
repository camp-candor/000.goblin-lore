export interface DynamicOccluderBit {
    readonly occluder_id: string
    readonly default_state: 'OPEN' | 'SHUT' | 'LOCKED'
    readonly acoustic_damping_penalty_cdb: number
}

export interface LocationFrontmatterBit {
    readonly id: string
    readonly type: 'location'
    readonly name: string
    readonly max_adult_goblins: number
    readonly acoustic_damping_cdb: number
    readonly ambient_noise_cdb: number
    readonly connected_locations: readonly string[]
    readonly dynamic_occluders: readonly DynamicOccluderBit[]
    readonly created_epoch: number
    readonly last_updated_epoch: number
}

export default interface Location {
    // idx:string;
    // locationBitList: any[];
    // locationBits:any;
}
