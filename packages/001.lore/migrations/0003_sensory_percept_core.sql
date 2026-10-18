-- Migration: 0003_sensory_percept_core.sql
-- Pure 7-Bit ASCII SQLite DDL for Sensory Percept Ledger Core

PRAGMA foreign_keys = ON;

-- 1. Physical World Events Ledger
CREATE TABLE IF NOT EXISTS physical_events (
    id TEXT PRIMARY KEY,
    room_id TEXT NOT NULL,
    initiator_id TEXT NOT NULL,
    action_verb TEXT NOT NULL,
    target_id TEXT,
    sound_power_cdb INTEGER NOT NULL DEFAULT 0 CHECK(sound_power_cdb >= 0),
    optical_signature_lux INTEGER NOT NULL DEFAULT 0 CHECK(optical_signature_lux >= 0),
    is_silent INTEGER NOT NULL DEFAULT 0 CHECK(is_silent IN (0, 1)),
    tick INTEGER NOT NULL CHECK(tick >= 0),
    created_at_epoch INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_events_room_tick ON physical_events(room_id, tick);

-- 2. Character Somatic Sensory Profiles
CREATE TABLE IF NOT EXISTS character_sensory_profiles (
    actor_id TEXT PRIMARY KEY,
    visual_acuity TEXT NOT NULL DEFAULT 'NORMAL' CHECK(visual_acuity IN ('NORMAL', 'MONOCULAR', 'BLIND')),
    hearing_threshold_cdb INTEGER NOT NULL DEFAULT 2000 CHECK(hearing_threshold_cdb >= 0),
    has_acoustic_trauma INTEGER NOT NULL DEFAULT 0 CHECK(has_acoustic_trauma IN (0, 1)),
    facing_direction INTEGER CHECK(facing_direction BETWEEN 0 AND 5),
    is_unconscious INTEGER NOT NULL DEFAULT 0 CHECK(is_unconscious IN (0, 1)),
    updated_at_epoch INTEGER NOT NULL DEFAULT 0
);

-- 3. Sensory Percept Candidates & Transduced Evidence
CREATE TABLE IF NOT EXISTS sensory_percepts (
    id TEXT PRIMARY KEY,
    observer_id TEXT NOT NULL REFERENCES character_sensory_profiles(actor_id),
    source_event_id TEXT NOT NULL REFERENCES physical_events(id) ON DELETE CASCADE,
    modality TEXT NOT NULL CHECK(modality IN ('VISUAL', 'AUDITORY', 'OLFACTORY', 'TACTILE')),
    perceived_intensity_bps INTEGER NOT NULL CHECK(perceived_intensity_bps BETWEEN 0 AND 10000),
    received_snr_cdb INTEGER NOT NULL,
    quality_score INTEGER NOT NULL CHECK(quality_score BETWEEN 0 AND 1000),
    is_resolved INTEGER NOT NULL DEFAULT 0 CHECK(is_resolved IN (0, 1)),
    apparent_location_id TEXT NOT NULL,
    apparent_source_id TEXT,
    tick INTEGER NOT NULL CHECK(tick >= 0),
    created_at_epoch INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_percepts_observer_tick ON sensory_percepts(observer_id, tick);
CREATE INDEX IF NOT EXISTS idx_percepts_source ON sensory_percepts(source_event_id);
