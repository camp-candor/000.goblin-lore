-- Stage A: Minimal Validated Core Relational Schema (Local SQLite / Cloudflare D1 Native)
-- Strict ASCII DDL, Foreign Key Cascades, and Monotonic Version Trigger

CREATE TABLE IF NOT EXISTS facts (
  id TEXT PRIMARY KEY,
  claim_text TEXT NOT NULL,
  scope TEXT CHECK(scope IN ('CHARACTER', 'LOCATION', 'LOGISTIC', 'LAW')) NOT NULL,
  authority_level TEXT CHECK(authority_level IN ('AXIOM', 'CANON', 'EVENT', 'RUNTIME_STATE', 'PROJECTION', 'SPECULATION')) NOT NULL DEFAULT 'CANON',
  standing TEXT CHECK(standing IN ('ACTIVE_ENDORSED', 'FLAGGED_FOR_REVIEW', 'DEPRECATED_ARCHIVED')) NOT NULL DEFAULT 'ACTIVE_ENDORSED',
  version INTEGER NOT NULL DEFAULT 1,
  author TEXT NOT NULL,
  created_at_ms INTEGER NOT NULL,
  last_edited_at_ms INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  episode_num INTEGER NOT NULL,
  scene_num INTEGER NOT NULL,
  text TEXT NOT NULL,
  status TEXT CHECK(status IN ('clean', 'dirty', 'reviewed')) NOT NULL DEFAULT 'clean',
  is_dirty INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS scene_fact_dependencies (
  scene_id TEXT NOT NULL,
  fact_id TEXT NOT NULL,
  pinned_version INTEGER NOT NULL,
  created_at_ms INTEGER NOT NULL,
  PRIMARY KEY (scene_id, fact_id),
  FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
  FOREIGN KEY (fact_id) REFERENCES facts(id) ON DELETE CASCADE
);

-- Monotonic Version Bump Trigger: Cascades dirty flag on NEW.version > OLD.version
-- Setting standing to FLAGGED_FOR_REVIEW without version bump triggers ZERO dirty cascades
CREATE TRIGGER IF NOT EXISTS trg_fact_version_bump
AFTER UPDATE ON facts
FOR EACH ROW
WHEN NEW.version > OLD.version OR (NEW.standing = 'DEPRECATED_ARCHIVED' AND OLD.standing != 'DEPRECATED_ARCHIVED')
BEGIN
  UPDATE scenes
  SET status = 'dirty', is_dirty = 1
  WHERE id IN (
    SELECT scene_id FROM scene_fact_dependencies
    WHERE fact_id = NEW.id AND (pinned_version < NEW.version OR NEW.standing = 'DEPRECATED_ARCHIVED')
  );
END;

-- Passive Centrality Telemetry View (In-Degree Narrative Blast Radius)
CREATE VIEW IF NOT EXISTS v_fact_centrality_telemetry AS
SELECT
  f.id AS fact_id,
  f.claim_text,
  f.standing,
  f.version,
  COUNT(d.scene_id) AS in_degree
FROM facts f
LEFT JOIN scene_fact_dependencies d ON f.id = d.fact_id
GROUP BY f.id;
