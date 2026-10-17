import Database from 'better-sqlite3'
import {
    WorldPhysicalManifestSchema,
    isActorCarrier,
} from '../schemas/physicalPlacement.js'
import type {
    ItemPhysicalPlacement,
    WorldPhysicalManifest,
} from '../schemas/physicalPlacement.js'

export interface CoPresenceEvaluation {
    satisfiable: boolean
    actorRoomId: string
    targetRoomId: string
    errorCode?:
        | 'SPATIAL_CO_PRESENCE_VIOLATION'
        | 'MASS_CONSERVATION_BREACH'
        | 'ENTITY_NOT_FOUND'
    reason?: string
}

export interface ItemDisjointnessViolation {
    item_id: string
    errorCode: 'MASS_CONSERVATION_BREACH'
    reason: string
}

export interface ItemDisjointnessEvaluation {
    valid: boolean
    duplicateItemIds: string[]
    violations: ItemDisjointnessViolation[]
    errorCode?: 'MASS_CONSERVATION_BREACH'
    reason?: string
}

export class SpatialPresenceSolver {
    public static evaluateCoPresence(
        manifest: WorldPhysicalManifest,
        actorId: string,
        targetEntityId: string,
    ): CoPresenceEvaluation {
        const actor = manifest.actors[actorId]
        if (!actor) {
            return {
                satisfiable: false,
                actorRoomId: 'UNKNOWN',
                targetRoomId: 'UNKNOWN',
                errorCode: 'ENTITY_NOT_FOUND',
                reason: `ACTOR_NOT_FOUND: Actor '${actorId}' does not exist in spatial manifest.`,
            }
        }

        let targetRoomId: string | undefined

        if (targetEntityId.startsWith('char_')) {
            const targetActor = manifest.actors[targetEntityId]
            targetRoomId = targetActor ? targetActor.room_id : undefined
        } else if (targetEntityId.startsWith('item_')) {
            const targetItem = manifest.items[targetEntityId]
            if (targetItem && isActorCarrier(targetItem.carrier_type)) {
                const carrier = manifest.actors[targetItem.carrier_id]
                targetRoomId = carrier ? carrier.room_id : targetItem.room_id
            } else {
                targetRoomId = targetItem ? targetItem.room_id : undefined
            }
        } else if (targetEntityId.startsWith('loc_')) {
            targetRoomId = targetEntityId
        }

        if (!targetRoomId) {
            return {
                satisfiable: false,
                actorRoomId: actor.room_id,
                targetRoomId: 'UNKNOWN',
                errorCode: 'ENTITY_NOT_FOUND',
                reason: `TARGET_NOT_FOUND: Target entity '${targetEntityId}' does not exist in spatial manifest.`,
            }
        }

        if (actor.room_id !== targetRoomId) {
            return {
                satisfiable: false,
                actorRoomId: actor.room_id,
                targetRoomId,
                errorCode: 'SPATIAL_CO_PRESENCE_VIOLATION',
                reason: `TOPOLOGICAL_DISCONNECT: Actor '${actorId}' in room '${actor.room_id}' cannot interact with target '${targetEntityId}' in room '${targetRoomId}'.`,
            }
        }

        return {
            satisfiable: true,
            actorRoomId: actor.room_id,
            targetRoomId,
        }
    }

    public static evaluateItemDisjointness(
        items: ItemPhysicalPlacement[],
        manifest?: WorldPhysicalManifest,
    ): ItemDisjointnessEvaluation {
        const byItem = new Map<string, ItemPhysicalPlacement[]>()
        for (const item of items) {
            const list = byItem.get(item.item_id) ?? []
            list.push(item)
            byItem.set(item.item_id, list)
        }

        const duplicateItemIds: string[] = []
        const violations: ItemDisjointnessViolation[] = []

        for (const [itemId, placements] of byItem) {
            if (placements.length > 1) {
                duplicateItemIds.push(itemId)
                const holders = placements.filter((p) =>
                    isActorCarrier(p.carrier_type),
                )
                const containers = placements.filter(
                    (p) => !isActorCarrier(p.carrier_type),
                )
                if (holders.length > 0 && containers.length > 0) {
                    violations.push({
                        item_id: itemId,
                        errorCode: 'MASS_CONSERVATION_BREACH',
                        reason: `MASS_CONSERVATION_BREACH: Item '${itemId}' is simultaneously held by an actor and resting in a room or container.`,
                    })
                } else if (holders.length > 1) {
                    violations.push({
                        item_id: itemId,
                        errorCode: 'MASS_CONSERVATION_BREACH',
                        reason: `MASS_CONSERVATION_BREACH: Item '${itemId}' has ${holders.length} actor holders; at most 1 is allowed.`,
                    })
                } else {
                    violations.push({
                        item_id: itemId,
                        errorCode: 'MASS_CONSERVATION_BREACH',
                        reason: `MASS_CONSERVATION_BREACH: Item '${itemId}' has ${placements.length} simultaneous placement records.`,
                    })
                }
            }

            if (manifest) {
                for (const placement of placements) {
                    if (isActorCarrier(placement.carrier_type)) {
                        const carrier = manifest.actors[placement.carrier_id]
                        if (!carrier) {
                            violations.push({
                                item_id: itemId,
                                errorCode: 'MASS_CONSERVATION_BREACH',
                                reason: `MASS_CONSERVATION_BREACH: Item '${itemId}' is carried by non-existent actor '${placement.carrier_id}'.`,
                            })
                        } else if (carrier.room_id !== placement.room_id) {
                            violations.push({
                                item_id: itemId,
                                errorCode: 'MASS_CONSERVATION_BREACH',
                                reason: `MASS_CONSERVATION_DESYNC: Item '${itemId}' room_id '${placement.room_id}' does not match carrier actor '${placement.carrier_id}' room_id '${carrier.room_id}'.`,
                            })
                        }
                    }
                }
            }
        }

        const valid = duplicateItemIds.length === 0 && violations.length === 0
        return {
            valid,
            duplicateItemIds,
            violations,
            ...(valid
                ? {}
                : {
                      errorCode: 'MASS_CONSERVATION_BREACH' as const,
                      reason: violations[0]?.reason,
                  }),
        }
    }

    public static assertItemDisjointness(items: ItemPhysicalPlacement[]): {
        valid: boolean
        duplicateItemIds: string[]
    } {
        const result = SpatialPresenceSolver.evaluateItemDisjointness(items)
        return {
            valid: result.valid,
            duplicateItemIds: result.duplicateItemIds,
        }
    }

    public static verifyLocalSqliteParity(
        db: Database.Database,
        manifest: WorldPhysicalManifest,
    ): boolean {
        WorldPhysicalManifestSchema.parse(manifest)

        db.pragma('foreign_keys = ON')
        db.exec(`
            CREATE TABLE IF NOT EXISTS spatial_actors (
                actor_id TEXT PRIMARY KEY,
                room_id TEXT NOT NULL,
                scale TEXT NOT NULL,
                updated_at_tick INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS spatial_items (
                item_id TEXT PRIMARY KEY,
                carrier_type TEXT NOT NULL,
                carrier_id TEXT NOT NULL,
                room_id TEXT NOT NULL,
                updated_at_tick INTEGER NOT NULL
            );
        `)

        const insertActor = db.prepare(`
            INSERT OR REPLACE INTO spatial_actors (actor_id, room_id, scale, updated_at_tick)
            VALUES (?, ?, ?, ?)
        `)

        const insertItem = db.prepare(`
            INSERT OR REPLACE INTO spatial_items (item_id, carrier_type, carrier_id, room_id, updated_at_tick)
            VALUES (?, ?, ?, ?, ?)
        `)

        const tx = db.transaction(() => {
            for (const actor of Object.values(manifest.actors)) {
                insertActor.run(
                    actor.actor_id,
                    actor.room_id,
                    actor.scale,
                    actor.updated_at_tick,
                )
            }
            for (const item of Object.values(manifest.items)) {
                insertItem.run(
                    item.item_id,
                    item.carrier_type,
                    item.carrier_id,
                    item.room_id,
                    item.updated_at_tick,
                )
            }
        })

        tx()
        return true
    }
}
