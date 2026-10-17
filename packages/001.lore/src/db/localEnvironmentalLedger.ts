import Database from 'better-sqlite3'
import {
    MaterialStateVector,
    MaterialStateVectorSchema,
} from '../schemas/materialState.js'
import {
    EnvironmentalZone,
    EnvironmentalZoneSchema,
} from '../schemas/environmentalOverlay.js'

export interface ShardDebrisRecord {
    item_id: string
    parent_item_id: string
    room_id: string
    carrier_type: 'ROOM_SURFACE'
    occupies_hands: number
    structural_integrity_bps: number
    is_operable: boolean
    created_at_tick: number
}

export class LocalEnvironmentalLedger {
    public db: Database.Database

    constructor(dbPath: string = ':memory:') {
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON')
        this.initSchema()
    }

    private initSchema(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS material_states (
        item_id TEXT PRIMARY KEY,
        material_class TEXT NOT NULL CHECK(material_class IN ('METALLIC', 'ORGANIC_WOOD', 'TEXTILE', 'GLASS_CERAMIC', 'STONE', 'CHEMICAL_LIQUID')),
        wetness_bps INTEGER NOT NULL CHECK(wetness_bps BETWEEN 0 AND 10000),
        corrosion_bps INTEGER NOT NULL CHECK(corrosion_bps BETWEEN 0 AND 10000),
        structural_integrity_bps INTEGER NOT NULL CHECK(structural_integrity_bps BETWEEN 0 AND 10000),
        damage_threshold_bps INTEGER NOT NULL CHECK(damage_threshold_bps BETWEEN 0 AND 10000),
        combustibility_tier TEXT NOT NULL CHECK(combustibility_tier IN ('IMMUNE', 'IGNITABLE', 'HIGHLY_VOLATILE')),
        is_operable INTEGER NOT NULL CHECK(is_operable IN (0, 1)),
        updated_at_epoch INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS environment_zones (
        zone_id TEXT PRIMARY KEY,
        ambient_lux INTEGER NOT NULL CHECK(ambient_lux >= 0),
        flooded_depth_cm INTEGER NOT NULL CHECK(flooded_depth_cm >= 0),
        mud_friction_bps INTEGER NOT NULL CHECK(mud_friction_bps BETWEEN 0 AND 10000),
        airborne_particulate_bps INTEGER NOT NULL CHECK(airborne_particulate_bps BETWEEN 0 AND 10000),
        acoustic_damping_cdb INTEGER NOT NULL CHECK(acoustic_damping_cdb >= 0),
        updated_at_epoch INTEGER NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS item_placements (
        item_id TEXT PRIMARY KEY,
        carrier_type TEXT NOT NULL CHECK(carrier_type IN ('ROOM_SURFACE', 'CONTAINER_FIXTURE', 'ACTOR_HELD', 'ACTOR_WORN', 'ACTOR_CARRIED')),
        carrier_id TEXT NOT NULL,
        room_id TEXT NOT NULL,
        slot_name TEXT,
        occupies_hands INTEGER NOT NULL DEFAULT 1 CHECK(occupies_hands BETWEEN 0 AND 2),
        is_secured INTEGER NOT NULL DEFAULT 1 CHECK(is_secured IN (0, 1)),
        updated_at_tick INTEGER NOT NULL DEFAULT 0,
        updated_at_ms INTEGER NOT NULL DEFAULT 0
      );
    `)
    }

    public upsertMaterialState(state: MaterialStateVector): void {
        const validated = MaterialStateVectorSchema.parse(state)
        const stmt = this.db.prepare(`
      INSERT INTO material_states (
        item_id, material_class, wetness_bps, corrosion_bps, structural_integrity_bps,
        damage_threshold_bps, combustibility_tier, is_operable, updated_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(item_id) DO UPDATE SET
        material_class = excluded.material_class,
        wetness_bps = excluded.wetness_bps,
        corrosion_bps = excluded.corrosion_bps,
        structural_integrity_bps = excluded.structural_integrity_bps,
        damage_threshold_bps = excluded.damage_threshold_bps,
        combustibility_tier = excluded.combustibility_tier,
        is_operable = excluded.is_operable,
        updated_at_epoch = excluded.updated_at_epoch;
    `)

        stmt.run(
            validated.item_id,
            validated.material_class,
            validated.wetness_bps,
            validated.corrosion_bps,
            validated.structural_integrity_bps,
            validated.damage_threshold_bps,
            validated.combustibility_tier,
            validated.is_operable ? 1 : 0,
            validated.updated_at_epoch,
        )
    }

    public getMaterialState(itemId: string): MaterialStateVector | undefined {
        const row = this.db
            .prepare('SELECT * FROM material_states WHERE item_id = ?')
            .get(itemId) as
            | {
                  item_id: string
                  material_class: MaterialStateVector['material_class']
                  wetness_bps: number
                  corrosion_bps: number
                  structural_integrity_bps: number
                  damage_threshold_bps: number
                  combustibility_tier: MaterialStateVector['combustibility_tier']
                  is_operable: number
                  updated_at_epoch: number
              }
            | undefined

        if (!row) return undefined

        return MaterialStateVectorSchema.parse({
            ...row,
            is_operable: row.is_operable === 1,
        })
    }

    public upsertZone(zone: EnvironmentalZone): void {
        const validated = EnvironmentalZoneSchema.parse(zone)
        this.db
            .prepare(
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
            )
            .run(
                validated.zone_id,
                validated.ambient_lux,
                validated.flooded_depth_cm,
                validated.mud_friction_bps,
                validated.airborne_particulate_bps,
                validated.acoustic_damping_cdb,
                validated.updated_at_epoch,
            )
    }

    public getZone(zoneId: string): EnvironmentalZone | undefined {
        const row = this.db
            .prepare('SELECT * FROM environment_zones WHERE zone_id = ?')
            .get(zoneId) as EnvironmentalZone | undefined

        return row ? EnvironmentalZoneSchema.parse(row) : undefined
    }

    /**
     * Atomically destroys an item and deposits sharp debris shards on the room floor
     */
    public breakItemAndSpawnDebris(
        itemId: string,
        roomId: string,
        currentTick: number,
    ): ShardDebrisRecord {
        const shardId = `${itemId}_shards`

        const tx = this.db.transaction(() => {
            // 1. Destroy original item
            this.db
                .prepare(
                    `
        UPDATE material_states
        SET structural_integrity_bps = 0, is_operable = 0, updated_at_epoch = ?
        WHERE item_id = ?
      `,
                )
                .run(Date.now(), itemId)

            // 2. Clear item placement from actor/container and mark it on room floor
            this.db
                .prepare(
                    `
        UPDATE item_placements
        SET carrier_type = 'ROOM_SURFACE', carrier_id = ?, slot_name = 'RUINED', updated_at_tick = ?, updated_at_ms = ?
        WHERE item_id = ?
      `,
                )
                .run(roomId, currentTick, Date.now(), itemId)

            // 3. Register shards in material_states
            this.db
                .prepare(
                    `
        INSERT INTO material_states (
          item_id, material_class, wetness_bps, corrosion_bps, structural_integrity_bps,
          damage_threshold_bps, combustibility_tier, is_operable, updated_at_epoch
        ) VALUES (?, 'GLASS_CERAMIC', 0, 0, 1000, 0, 'IMMUNE', 0, ?)
        ON CONFLICT(item_id) DO UPDATE SET structural_integrity_bps = 1000;
      `,
                )
                .run(shardId, Date.now())

            // 4. Place shards on room surface
            this.db
                .prepare(
                    `
        INSERT INTO item_placements (
          item_id, carrier_type, carrier_id, room_id, slot_name, occupies_hands, is_secured, updated_at_tick, updated_at_ms
        ) VALUES (?, 'ROOM_SURFACE', ?, ?, 'FLOOR_DEBRIS', 0, 0, ?, ?)
        ON CONFLICT(item_id) DO UPDATE SET room_id = excluded.room_id;
      `,
                )
                .run(shardId, roomId, roomId, currentTick, Date.now())
        })

        tx()

        return {
            item_id: shardId,
            parent_item_id: itemId,
            room_id: roomId,
            carrier_type: 'ROOM_SURFACE',
            occupies_hands: 0,
            structural_integrity_bps: 1000,
            is_operable: false,
            created_at_tick: currentTick,
        }
    }

    public close(): void {
        this.db.close()
    }
}
