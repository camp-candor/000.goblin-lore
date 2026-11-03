export const SOMATIC_LEDGER_SQL_DDL = `
CREATE TABLE IF NOT EXISTS entities_somatic_live (
  entity_id TEXT PRIMARY KEY,
  locomotion_baseline TEXT NOT NULL,
  available_arms_bps INTEGER NOT NULL CHECK (available_arms_bps BETWEEN 0 AND 20000),
  arms_available INTEGER NOT NULL CHECK (arms_available BETWEEN 0 AND 2),
  legs_available INTEGER NOT NULL CHECK (legs_available BETWEEN 0 AND 2),
  locomotion_tier TEXT NOT NULL CHECK (locomotion_tier IN ('UNRESTRICTED', 'LIMPING', 'IMMOBILIZED')),
  chronic_fatigue_floor_bps INTEGER NOT NULL CHECK (chronic_fatigue_floor_bps BETWEEN 0 AND 10000),
  chronic_pain_floor_bps INTEGER NOT NULL CHECK (chronic_pain_floor_bps BETWEEN 0 AND 10000),
  chronic_refusal_strain_floor_bps INTEGER NOT NULL CHECK (chronic_refusal_strain_floor_bps BETWEEN 0 AND 10000),
  chronic_paranoia_floor_bps INTEGER NOT NULL CHECK (chronic_paranoia_floor_bps BETWEEN 0 AND 10000),
  active_conditions_json TEXT NOT NULL DEFAULT '[]',
  banned_verbs_json TEXT NOT NULL DEFAULT '[]',
  auditory_debuff_cdb INTEGER NOT NULL CHECK (auditory_debuff_cdb BETWEEN 0 AND 10000),
  dsp_deltas_json TEXT NOT NULL DEFAULT '{}',
  source_dossier_path TEXT NOT NULL,
  content_sha256 TEXT NOT NULL,
  updated_at_epoch INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS pressure_meters_live (
  meter_id TEXT PRIMARY KEY,
  entity_id TEXT NOT NULL REFERENCES entities_somatic_live(entity_id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('SOMATIC_FATIGUE', 'PHYSICAL_PAIN', 'REFUSAL_STRAIN', 'PARANOIA_CLOCK')),
  current_value_bp INTEGER NOT NULL CHECK (current_value_bp BETWEEN 0 AND 10000),
  baseline_bp INTEGER NOT NULL CHECK (baseline_bp BETWEEN 0 AND 10000),
  decay_rate_per_cycle_bp INTEGER NOT NULL CHECK (decay_rate_per_cycle_bp BETWEEN 0 AND 10000),
  threshold_limit_bp INTEGER NOT NULL CHECK (threshold_limit_bp BETWEEN 0 AND 10000),
  is_broken INTEGER NOT NULL DEFAULT 0 CHECK (is_broken IN (0, 1)),
  updated_at_epoch INTEGER NOT NULL,
  UNIQUE(entity_id, category)
);

CREATE INDEX IF NOT EXISTS idx_entities_somatic_tier ON entities_somatic_live(locomotion_tier);
CREATE INDEX IF NOT EXISTS idx_pressure_meters_entity ON pressure_meters_live(entity_id);
`
