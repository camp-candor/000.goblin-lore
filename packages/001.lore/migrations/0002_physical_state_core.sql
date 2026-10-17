-- Migration: 0002_physical_state_core.sql
-- Pure 7-Bit ASCII SQLite DDL for Ground-Truth Physical State Core

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
