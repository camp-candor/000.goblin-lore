-- Phase 5 Physical State Core Schema Migration (Local SQLite / Cloudflare D1 Native)
-- Dialect-pure ASCII DDL, Foreign Key Cascades, and Integer Basis-Point Constraints

CREATE TABLE IF NOT EXISTS rooms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  is_submerged INTEGER NOT NULL DEFAULT 0 CHECK(is_submerged IN (0, 1)),
  ambient_lux INTEGER NOT NULL DEFAULT 500 CHECK(ambient_lux >= 0),
  acoustic_damping_cb INTEGER NOT NULL DEFAULT 2000 CHECK(acoustic_damping_cb >= 0)
);

CREATE TABLE IF NOT EXISTS room_portals (
  from_room_id TEXT NOT NULL,
  to_room_id TEXT NOT NULL,
  is_passable INTEGER NOT NULL DEFAULT 1 CHECK(is_passable IN (0, 1)),
  wall_damping_cb INTEGER NOT NULL DEFAULT 3500 CHECK(wall_damping_cb >= 0),
  PRIMARY KEY (from_room_id, to_room_id),
  FOREIGN KEY (from_room_id) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (to_room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS entities_physical (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location_id TEXT NOT NULL,
  vitality_bps INTEGER NOT NULL CHECK(vitality_bps BETWEEN 0 AND 10000),
  consciousness_status TEXT CHECK(consciousness_status IN ('AWAKE', 'STUNNED', 'UNCONSCIOUS', 'DECEASED')) NOT NULL DEFAULT 'AWAKE',
  active_conditions TEXT NOT NULL DEFAULT '[]',
  banned_kinetic_verbs TEXT NOT NULL DEFAULT '[]',
  updated_at_tick INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (location_id) REFERENCES rooms(id)
);

CREATE TABLE IF NOT EXISTS item_placements (
  item_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  carrier_type TEXT CHECK(carrier_type IN ('ROOM', 'ACTOR_SLOT')) NOT NULL,
  carrier_id TEXT NOT NULL,
  slot_name TEXT,
  wetness_bps INTEGER NOT NULL DEFAULT 0 CHECK(wetness_bps BETWEEN 0 AND 10000),
  combustibility_tier TEXT CHECK(combustibility_tier IN ('IMMUNE', 'IGNITABLE', 'HIGHLY_VOLATILE')) NOT NULL DEFAULT 'IGNITABLE',
  structural_integrity_bps INTEGER NOT NULL DEFAULT 10000 CHECK(structural_integrity_bps BETWEEN 0 AND 10000)
);

CREATE TABLE IF NOT EXISTS material_states (
  entity_id TEXT PRIMARY KEY,
  corrosion_bps INTEGER NOT NULL DEFAULT 0 CHECK(corrosion_bps BETWEEN 0 AND 10000),
  structural_integrity_bps INTEGER NOT NULL DEFAULT 10000 CHECK(structural_integrity_bps BETWEEN 0 AND 10000),
  is_operable INTEGER NOT NULL DEFAULT 1 CHECK(is_operable IN (0, 1)),
  updated_at_tick INTEGER NOT NULL DEFAULT 0
);

-- Indices for sub-millisecond local graph resolution and D1 edge lookups
CREATE INDEX IF NOT EXISTS idx_entities_physical_loc ON entities_physical(location_id);
CREATE INDEX IF NOT EXISTS idx_item_placements_carrier ON item_placements(carrier_type, carrier_id);

