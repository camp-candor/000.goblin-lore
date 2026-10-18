import Database from 'better-sqlite3'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

export interface PhysicalEntityRecord {
    id: string
    room_id: string
    coord_q: number
    coord_r: number
    coord_s: number
    scale: 'STAGED' | 'IN_TRANSIT'
    transit_edge_id?: string | null
    vitality_bps: number
    consciousness_status: 'AWAKE' | 'STUNNED' | 'UNCONSCIOUS' | 'DECEASED'
    available_arms: number
    locomotion_tier:
        'bipedal_standard' | 'bipedal_hunched' | 'limping' | 'immobilized'
    updated_at_tick: number
    updated_at_ms: number
}

export interface ItemPlacementRecord {
    item_id: string
    carrier_type:
        | 'ROOM_SURFACE'
        | 'CONTAINER_FIXTURE'
        | 'ACTOR_HELD'
        | 'ACTOR_WORN'
        | 'ACTOR_CARRIED'
    carrier_id: string
    room_id: string
    slot_name?: string | null
    occupies_hands: number
    is_secured: number
    updated_at_tick: number
    updated_at_ms: number
}

export interface RoomPortalRecord {
    from_room_id: string
    to_room_id: string
    portal_status: 'OPEN' | 'CLOSED' | 'LOCKED' | 'COLLAPSED'
    traversal_cost_ticks: number
}

export class LocalSpatialSomaticLedger {
    public db: Database.Database

    constructor(dbPath: string = ':memory:') {
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON')
        this.runMigrations()
    }

    private runMigrations(): void {
        this.db.exec(`
PRAGMA foreign_keys = ON;

-- 1. Spatial Topology: Rooms and Discrete Zones
CREATE TABLE IF NOT EXISTS spatial_rooms (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    capacity_actors INTEGER NOT NULL DEFAULT 10 CHECK(capacity_actors > 0),
    is_sealed INTEGER NOT NULL DEFAULT 0 CHECK(is_sealed IN (0, 1)),
    created_at_epoch INTEGER NOT NULL DEFAULT 0
);

-- 2. Topological Adjacency: Directional Portals Between Rooms
CREATE TABLE IF NOT EXISTS room_portals (
    from_room_id TEXT NOT NULL REFERENCES spatial_rooms(id) ON DELETE CASCADE,
    to_room_id TEXT NOT NULL REFERENCES spatial_rooms(id) ON DELETE CASCADE,
    portal_status TEXT NOT NULL DEFAULT 'OPEN' CHECK(portal_status IN ('OPEN', 'CLOSED', 'LOCKED', 'COLLAPSED')),
    traversal_cost_ticks INTEGER NOT NULL DEFAULT 1 CHECK(traversal_cost_ticks >= 1),
    PRIMARY KEY (from_room_id, to_room_id),
    CHECK(from_room_id != to_room_id)
);

-- 3. Physical Entity State: Somatic, Locomotion, and Spatial Position
CREATE TABLE IF NOT EXISTS entities_physical (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL REFERENCES spatial_rooms(id),
    coord_q INTEGER NOT NULL DEFAULT 0,
    coord_r INTEGER NOT NULL DEFAULT 0,
    coord_s INTEGER NOT NULL DEFAULT 0,
    scale TEXT NOT NULL DEFAULT 'STAGED' CHECK(scale IN ('STAGED', 'IN_TRANSIT')),
    transit_edge_id TEXT,
    vitality_bps INTEGER NOT NULL DEFAULT 10000 CHECK(vitality_bps BETWEEN 0 AND 10000),
    consciousness_status TEXT NOT NULL DEFAULT 'AWAKE' CHECK(consciousness_status IN ('AWAKE', 'STUNNED', 'UNCONSCIOUS', 'DECEASED')),
    available_arms INTEGER NOT NULL DEFAULT 2 CHECK(available_arms BETWEEN 0 AND 2),
    locomotion_tier TEXT NOT NULL DEFAULT 'bipedal_standard' CHECK(locomotion_tier IN ('bipedal_standard', 'bipedal_hunched', 'limping', 'immobilized')),
    updated_at_tick INTEGER NOT NULL DEFAULT 0,
    updated_at_ms INTEGER NOT NULL DEFAULT 0,
    CHECK(coord_q + coord_r + coord_s = 0)
);

CREATE INDEX IF NOT EXISTS idx_entities_physical_room ON entities_physical(room_id);

-- 4. Item Placements: Strict Single Carrier & Matter Conservation
CREATE TABLE IF NOT EXISTS item_placements (
    item_id TEXT PRIMARY KEY,
    carrier_type TEXT NOT NULL CHECK(carrier_type IN ('ROOM_SURFACE', 'CONTAINER_FIXTURE', 'ACTOR_HELD', 'ACTOR_WORN', 'ACTOR_CARRIED')),
    carrier_id TEXT NOT NULL,
    room_id TEXT NOT NULL REFERENCES spatial_rooms(id),
    slot_name TEXT,
    occupies_hands INTEGER NOT NULL DEFAULT 1 CHECK(occupies_hands BETWEEN 0 AND 2),
    is_secured INTEGER NOT NULL DEFAULT 1 CHECK(is_secured IN (0, 1)),
    updated_at_tick INTEGER NOT NULL DEFAULT 0,
    updated_at_ms INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_items_carrier ON item_placements(carrier_id, carrier_type);
CREATE INDEX IF NOT EXISTS idx_items_room ON item_placements(room_id);

-- 5. Physical Immobility Trigger: Prevent Movement if Unconscious or Deceased
CREATE TRIGGER IF NOT EXISTS trg_prevent_incapacitated_movement
BEFORE UPDATE OF room_id, coord_q, coord_r, coord_s ON entities_physical
FOR EACH ROW
WHEN OLD.consciousness_status IN ('UNCONSCIOUS', 'DECEASED')
BEGIN
    SELECT RAISE(FAIL, 'FATAL: [PHYSICAL_LEDGER] Incapacitated or deceased actors cannot alter physical position.');
END;
        `)
    }

    public registerRoom(id: string, name: string, capacity: number = 10): void {
        this.db
            .prepare(
                `
      INSERT INTO spatial_rooms (id, name, capacity_actors, created_at_epoch)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = excluded.name, capacity_actors = excluded.capacity_actors;
    `,
            )
            .run(id, name, capacity, Date.now())
    }

    public registerPortal(portal: RoomPortalRecord): void {
        this.db
            .prepare(
                `
      INSERT INTO room_portals (from_room_id, to_room_id, portal_status, traversal_cost_ticks)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(from_room_id, to_room_id) DO UPDATE SET
        portal_status = excluded.portal_status,
        traversal_cost_ticks = excluded.traversal_cost_ticks;
    `,
            )
            .run(
                portal.from_room_id,
                portal.to_room_id,
                portal.portal_status,
                portal.traversal_cost_ticks,
            )
    }

    public upsertEntity(entity: PhysicalEntityRecord): void {
        const stmt = this.db.prepare(`
      INSERT INTO entities_physical (
        id, room_id, coord_q, coord_r, coord_s, scale, transit_edge_id,
        vitality_bps, consciousness_status, available_arms, locomotion_tier,
        updated_at_tick, updated_at_ms
      ) VALUES (
        @id, @room_id, @coord_q, @coord_r, @coord_s, @scale, @transit_edge_id,
        @vitality_bps, @consciousness_status, @available_arms, @locomotion_tier,
        @updated_at_tick, @updated_at_ms
      )
      ON CONFLICT(id) DO UPDATE SET
        room_id = excluded.room_id,
        coord_q = excluded.coord_q,
        coord_r = excluded.coord_r,
        coord_s = excluded.coord_s,
        scale = excluded.scale,
        transit_edge_id = excluded.transit_edge_id,
        vitality_bps = excluded.vitality_bps,
        consciousness_status = excluded.consciousness_status,
        available_arms = excluded.available_arms,
        locomotion_tier = excluded.locomotion_tier,
        updated_at_tick = excluded.updated_at_tick,
        updated_at_ms = excluded.updated_at_ms;
    `)
        stmt.run({
            ...entity,
            transit_edge_id: entity.transit_edge_id ?? null,
        })
    }

    public upsertItem(item: ItemPlacementRecord): void {
        this.db
            .prepare(
                `
      INSERT INTO item_placements (
        item_id, carrier_type, carrier_id, room_id, slot_name,
        occupies_hands, is_secured, updated_at_tick, updated_at_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(item_id) DO UPDATE SET
        carrier_type = excluded.carrier_type,
        carrier_id = excluded.carrier_id,
        room_id = excluded.room_id,
        slot_name = excluded.slot_name,
        occupies_hands = excluded.occupies_hands,
        is_secured = excluded.is_secured,
        updated_at_tick = excluded.updated_at_tick,
        updated_at_ms = excluded.updated_at_ms;
    `,
            )
            .run(
                item.item_id,
                item.carrier_type,
                item.carrier_id,
                item.room_id,
                item.slot_name ?? null,
                item.occupies_hands,
                item.is_secured,
                item.updated_at_tick,
                item.updated_at_ms,
            )
    }

    /**
     * Executes actor movement across topological room boundaries.
     * Halts if rooms are non-adjacent or if portal is not OPEN.
     */
    public recordPhysicalMove(
        actorId: string,
        toRoomId: string,
        currentTick: number,
    ): void {
        const actor = this.getEntity(actorId)
        if (!actor) {
            throw new Error(
                `ACTOR_NOT_FOUND: Entity '${actorId}' does not exist.`,
            )
        }

        if (actor.room_id === toRoomId) {
            return // Already present in room
        }

        const portal = this.db
            .prepare(
                `
      SELECT portal_status FROM room_portals
      WHERE from_room_id = ? AND to_room_id = ?
    `,
            )
            .get(actor.room_id, toRoomId) as
            { portal_status: string } | undefined

        if (!portal) {
            throw new Error(
                `ILLEGAL_TRANSIT_DISCONNECT: No portal exists between '${actor.room_id}' and '${toRoomId}'.`,
            )
        }

        if (portal.portal_status !== 'OPEN') {
            throw new Error(
                `PORTAL_BLOCKED_HALT: Portal between '${actor.room_id}' and '${toRoomId}' is '${portal.portal_status}'.`,
            )
        }

        const tx = this.db.transaction(() => {
            // 1. Move actor
            this.db
                .prepare(
                    `
        UPDATE entities_physical
        SET room_id = ?, updated_at_tick = ?, updated_at_ms = ?
        WHERE id = ?
      `,
                )
                .run(toRoomId, currentTick, Date.now(), actorId)

            // 2. Move all carried/held/worn items with the actor
            this.db
                .prepare(
                    `
        UPDATE item_placements
        SET room_id = ?, updated_at_tick = ?, updated_at_ms = ?
        WHERE carrier_id = ? AND carrier_type IN ('ACTOR_HELD', 'ACTOR_WORN', 'ACTOR_CARRIED')
      `,
                )
                .run(toRoomId, currentTick, Date.now(), actorId)
        })

        tx()
    }

    /**
     * Transfers an item between carriers with strict co-presence and hand capacity enforcement.
     */
    public transferItem(
        itemId: string,
        recipientActorId: string,
        targetSlot: 'ACTOR_HELD' | 'ACTOR_WORN' | 'ACTOR_CARRIED',
        currentTick: number,
    ): void {
        const item = this.getItem(itemId)
        if (!item) {
            throw new Error(`ITEM_NOT_FOUND: Item '${itemId}' does not exist.`)
        }

        const recipient = this.getEntity(recipientActorId)
        if (!recipient) {
            throw new Error(
                `RECIPIENT_NOT_FOUND: Actor '${recipientActorId}' does not exist.`,
            )
        }

        // Co-presence assertion
        if (item.room_id !== recipient.room_id) {
            throw new Error(
                `SPATIAL_CO_PRESENCE_VIOLATION: Item in '${item.room_id}' cannot be acquired by actor in '${recipient.room_id}'.`,
            )
        }

        // Hand capacity evaluation
        if (targetSlot === 'ACTOR_HELD' && item.occupies_hands > 0) {
            const heldItems = this.db
                .prepare(
                    `
        SELECT SUM(occupies_hands) AS total_hands
        FROM item_placements
        WHERE carrier_id = ? AND carrier_type = 'ACTOR_HELD' AND item_id != ?
      `,
                )
                .get(recipientActorId, itemId) as {
                total_hands: number | null
            }

            const currentHeldHands = heldItems.total_hands || 0
            if (
                currentHeldHands + item.occupies_hands >
                recipient.available_arms
            ) {
                throw new Error(
                    `SOMATIC_CAPACITY_EXCEEDED: Recipient '${recipientActorId}' has ${recipient.available_arms} arms but requires ${currentHeldHands + item.occupies_hands} hands.`,
                )
            }
        }

        const tx = this.db.transaction(() => {
            this.db
                .prepare(
                    `
      UPDATE item_placements
      SET carrier_type = ?, carrier_id = ?, slot_name = ?, updated_at_tick = ?, updated_at_ms = ?
      WHERE item_id = ?
    `,
                )
                .run(
                    targetSlot,
                    recipientActorId,
                    targetSlot,
                    currentTick,
                    Date.now(),
                    itemId,
                )
        })
        tx()
    }

    /**
     * Applies somatic trauma and automatically ejects held items to room floor if hands are over-saturated.
     */
    public applySomaticTrauma(
        actorId: string,
        penaltyArms: number,
        newVitalityBps: number,
        newLocomotion: PhysicalEntityRecord['locomotion_tier'],
        currentTick: number,
    ): void {
        const actor = this.getEntity(actorId)
        if (!actor) {
            throw new Error(
                `ACTOR_NOT_FOUND: Entity '${actorId}' does not exist.`,
            )
        }

        const updatedArms = Math.max(0, actor.available_arms - penaltyArms)

        const tx = this.db.transaction(() => {
            // 1. Update actor somatic state
            this.db
                .prepare(
                    `
        UPDATE entities_physical
        SET available_arms = ?, vitality_bps = ?, locomotion_tier = ?, updated_at_tick = ?, updated_at_ms = ?
        WHERE id = ?
      `,
                )
                .run(
                    updatedArms,
                    newVitalityBps,
                    newLocomotion,
                    currentTick,
                    Date.now(),
                    actorId,
                )

            // 2. Query currently held items
            const heldItems = this.db
                .prepare(
                    `
        SELECT item_id, occupies_hands FROM item_placements
        WHERE carrier_id = ? AND carrier_type = 'ACTOR_HELD'
        ORDER BY occupies_hands DESC
      `,
                )
                .all(actorId) as Array<{
                item_id: string
                occupies_hands: number
            }>

            let totalDemanded = heldItems.reduce(
                (acc, it) => acc + it.occupies_hands,
                0,
            )

            // 3. Drop excess held items onto the floor of the current room
            for (const it of heldItems) {
                if (totalDemanded > updatedArms) {
                    this.db
                        .prepare(
                            `
            UPDATE item_placements
            SET carrier_type = 'ROOM_SURFACE', carrier_id = ?, slot_name = 'FLOOR', updated_at_tick = ?, updated_at_ms = ?
            WHERE item_id = ?
          `,
                        )
                        .run(actor.room_id, currentTick, Date.now(), it.item_id)

                    totalDemanded -= it.occupies_hands
                }
            }
        })

        tx()
    }

    public getEntity(id: string): PhysicalEntityRecord | undefined {
        return this.db
            .prepare('SELECT * FROM entities_physical WHERE id = ?')
            .get(id) as PhysicalEntityRecord | undefined
    }

    public getItem(id: string): ItemPlacementRecord | undefined {
        return this.db
            .prepare('SELECT * FROM item_placements WHERE item_id = ?')
            .get(id) as ItemPlacementRecord | undefined
    }

    public queryRoomState(roomId: string): {
        actors: PhysicalEntityRecord[]
        items: ItemPlacementRecord[]
    } {
        const actors = this.db
            .prepare('SELECT * FROM entities_physical WHERE room_id = ?')
            .all(roomId) as PhysicalEntityRecord[]
        const items = this.db
            .prepare('SELECT * FROM item_placements WHERE room_id = ?')
            .all(roomId) as ItemPlacementRecord[]
        return { actors, items }
    }

    public assertMassConservation(): boolean {
        const duplicates = this.db
            .prepare(
                `
      SELECT item_id, COUNT(*) AS cnt FROM item_placements
      GROUP BY item_id HAVING cnt > 1
    `,
            )
            .all()

        if (duplicates.length > 0) {
            return false
        }

        const desyncedItems = this.db
            .prepare(
                `
      SELECT i.item_id FROM item_placements i
      JOIN entities_physical e ON i.carrier_id = e.id
      WHERE i.carrier_type IN ('ACTOR_HELD', 'ACTOR_WORN', 'ACTOR_CARRIED') AND i.room_id != e.room_id
    `,
            )
            .all()

        return desyncedItems.length === 0
    }

    public close(): void {
        this.db.close()
    }
}
