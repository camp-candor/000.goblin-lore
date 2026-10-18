-- Migration: 0003_pardon_ledger.sql
-- Pure 7-Bit ASCII SQLite DDL for Scoped Pardon Ledger & Tamper Guard

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS pardon_waivers (
  id TEXT PRIMARY KEY,
  rule_id TEXT NOT NULL,
  target_series_id TEXT NOT NULL,
  target_episode_id TEXT NOT NULL,
  target_scene_id TEXT NOT NULL,
  target_shot_id TEXT,
  target_entity_id TEXT NOT NULL,
  authorizer_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  granted_against_entity_hash TEXT NOT NULL CHECK(length(granted_against_entity_hash) == 64),
  granted_against_canon_root TEXT NOT NULL CHECK(length(granted_against_canon_root) == 64),
  injected_mutation_json TEXT,
  created_at_ms INTEGER NOT NULL CHECK(created_at_ms >= 0),
  -- Engine-Level Physical & Epistemic Invariant Defense
  -- Hard physical, somatic, and mystery violations are strictly non-insertable
  CHECK (rule_id NOT IN (
    'rule_kinetic_limb_conservation',
    'rule_bimanual_coordination',
    'rule_unresolved_epistemic_leak',
    'SOMATIC_SAT_BREACH',
    'MASS_CONSERVATION_BREACH',
    'VOCAL_FEASIBILITY_BREACH',
    'SPATIAL_CO_PRESENCE_VIOLATION'
  ))
);

CREATE INDEX IF NOT EXISTS idx_pardon_target_entity ON pardon_waivers(target_entity_id);
CREATE INDEX IF NOT EXISTS idx_pardon_rule_id ON pardon_waivers(rule_id);
CREATE INDEX IF NOT EXISTS idx_pardon_scene_lookup ON pardon_waivers(target_series_id, target_episode_id, target_scene_id);
