import Database from "better-sqlite3";

export interface FactRecord {
  id: string;
  claim_text: string;
  scope: "CHARACTER" | "LOCATION" | "LOGISTIC" | "LAW";
  version: number;
  author: string;
  created_at: number;
  last_edited_at: number;
}

export interface SceneRecord {
  id: string;
  episode_num: number;
  scene_num: number;
  text: string;
  status: "clean" | "dirty" | "reviewed";
  is_dirty: number;
}

export class LocalSqliteLedger {
  public db: Database.Database;

  constructor(dbPath: string = ":memory:") {
    this.db = new Database(dbPath);
    this.db.pragma("foreign_keys = ON");
    this.initSchema();
  }

  private initSchema(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS facts (
        id TEXT PRIMARY KEY,
        claim_text TEXT NOT NULL,
        scope TEXT CHECK(scope IN ('CHARACTER', 'LOCATION', 'LOGISTIC', 'LAW')) NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        author TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_edited_at INTEGER NOT NULL
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
        created_at INTEGER NOT NULL,
        PRIMARY KEY (scene_id, fact_id),
        FOREIGN KEY (scene_id) REFERENCES scenes(id) ON DELETE CASCADE,
        FOREIGN KEY (fact_id) REFERENCES facts(id) ON DELETE CASCADE
      );

      CREATE TRIGGER IF NOT EXISTS trg_fact_version_bump
      AFTER UPDATE ON facts
      FOR EACH ROW
      WHEN NEW.version > OLD.version
      BEGIN
        UPDATE scenes
        SET status = 'dirty', is_dirty = 1
        WHERE id IN (
          SELECT scene_id FROM scene_fact_dependencies
          WHERE fact_id = NEW.id AND pinned_version < NEW.version
        );
      END;

      CREATE VIEW IF NOT EXISTS v_fact_centrality_telemetry AS
      SELECT
        f.id AS fact_id,
        f.claim_text,
        f.version,
        COUNT(d.scene_id) AS in_degree
      FROM facts f
      LEFT JOIN scene_fact_dependencies d ON f.id = d.fact_id
      GROUP BY f.id;
    `);
  }

  public insertFact(fact: FactRecord): void {
    const stmt = this.db.prepare(`
      INSERT INTO facts (id, claim_text, scope, version, author, created_at, last_edited_at)
      VALUES (@id, @claim_text, @scope, @version, @author, @created_at, @last_edited_at)
    `);
    stmt.run(fact);
  }

  public bumpFactVersion(factId: string, newVersion: number): void {
    const stmt = this.db.prepare(`
      UPDATE facts
      SET version = ?, last_edited_at = ?
      WHERE id = ?
    `);
    stmt.run(newVersion, Date.now(), factId);
  }

  public registerScene(scene: SceneRecord, dependencies: Array<{ factId: string; pinnedVersion: number }>): void {
    const insertScene = this.db.prepare(`
      INSERT INTO scenes (id, episode_num, scene_num, text, status, is_dirty)
      VALUES (@id, @episode_num, @scene_num, @text, @status, @is_dirty)
    `);
    const insertDep = this.db.prepare(`
      INSERT INTO scene_fact_dependencies (scene_id, fact_id, pinned_version, created_at)
      VALUES (?, ?, ?, ?)
    `);

    const tx = this.db.transaction(() => {
      insertScene.run(scene);
      for (const dep of dependencies) {
        insertDep.run(scene.id, dep.factId, dep.pinnedVersion, Date.now());
      }
    });
    tx();
  }

  public getScene(sceneId: string): SceneRecord | undefined {
    return this.db.prepare("SELECT * FROM scenes WHERE id = ?").get(sceneId) as SceneRecord | undefined;
  }

  public close(): void {
    this.db.close();
  }
}
