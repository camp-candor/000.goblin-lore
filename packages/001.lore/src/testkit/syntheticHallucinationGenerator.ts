export interface TeleportationAttackPayload {
    actor_id: string
    source_room_id: string
    target_room_id: string
    attempted_action: 'MOVE_TO_ROOM'
}

export interface GhostGraspAttackPayload {
    actor_id: string
    target_item_id: string
    victim_actor_id: string
    attempted_action: 'EQUIP_ITEM'
}

export interface PostMortemAttackPayload {
    actor_id: string
    vitality_bps: number
    consciousness_status: 'DECEASED'
    attempted_action: 'SPEAK' | 'STRIKE'
    dialogue_text?: string
}

export interface MuteUtteranceAttackPayload {
    actor_id: string
    active_condition: 'cond_severed_trachea' | 'cond_crushed_larynx'
    dialogue_text: string
    observable_parenthetical: string
}

export interface MaterialImmunityAttackPayload {
    actor_id: string
    item_id: string
    environment_room_id: string
    item_wetness_bps: number
    attempted_action: 'IGNITE'
}

export class SyntheticHallucinationGenerator {
    /**
     * Trap 1: Teleportation Attack (Moving between non-adjacent rooms)
     */
    public static generateTeleportationAttack(): TeleportationAttackPayload {
        return {
            actor_id: 'char_wart',
            source_room_id: 'loc_culvert',
            target_room_id: 'loc_attic', // Non-adjacent: requires passing pump house and ladder
            attempted_action: 'MOVE_TO_ROOM',
        }
    }

    /**
     * Trap 2: Ghost Grasp Attack (Equipping an item held by another actor)
     */
    public static generateGhostGraspAttack(): GhostGraspAttackPayload {
        return {
            actor_id: 'char_wart',
            target_item_id: 'item_brass_siphon',
            victim_actor_id: 'char_bog', // Siphon is currently locked in Bog's hands
            attempted_action: 'EQUIP_ITEM',
        }
    }

    /**
     * Trap 3: Post-Mortem Action Attack (Deceased actor speaking or moving)
     */
    public static generatePostMortemAttack(): PostMortemAttackPayload {
        return {
            actor_id: 'char_mum_grissel',
            vitality_bps: 0,
            consciousness_status: 'DECEASED',
            attempted_action: 'SPEAK',
            dialogue_text: 'Beware the rising damp in the culvert.',
        }
    }

    /**
     * Trap 4: Mute Utterance Attack (Spoken dialogue from severed trachea)
     */
    public static generateMuteUtteranceAttack(): MuteUtteranceAttackPayload {
        return {
            actor_id: 'char_silas',
            active_condition: 'cond_severed_trachea',
            dialogue_text: 'Close the floodgate before the water surges!',
            observable_parenthetical:
                'Clutching bloody throat and shouting loudly',
        }
    }

    /**
     * Trap 5: Material Immunity Attack (Igniting wet matches in submerged room)
     */
    public static generateMaterialImmunityAttack(): MaterialImmunityAttackPayload {
        return {
            actor_id: 'char_bog',
            item_id: 'item_matches',
            environment_room_id: 'loc_flooded_sump',
            item_wetness_bps: 8500, // > 3000 bps combustibility threshold
            attempted_action: 'IGNITE',
        }
    }
}
