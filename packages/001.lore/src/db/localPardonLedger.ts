import Database from "better-sqlite3";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from 'node:url';
import { PardonRecord, PardonRecordSchema } from "../../schemas/pardon.schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class LocalPardonLedger {
  public db: Database.Database;

  constructor(dbPath: string = ":memory:") {
    this.db = new Database(dbPath);
    this.db.pragma("foreign_keys = ON");
    this.initSchema();
  }

  private initSchema(): void {
    const migrationPath = path.resolve(__dirname, "../../migrations/0003_pardon_ledger.sql");
    if (fs.existsSync(migrationPath)) {
      const ddl = fs.readFileSync(migrationPath, "utf8");
      this.db.exec(ddl);
    } else {
      // Inline fallback for isolated unit test environments
      this.db.exec(`
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
          granted_against_entity_hash TEXT NOT NULL,
          granted_against_canon_root TEXT NOT NULL,
          injected_mutation_json TEXT,
          created_at_ms INTEGER NOT NULL,
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
      `);
    }
  }

  public recordPardon(pardon: PardonRecord, epochMs: number = Date.now()): void {
    const validated = PardonRecordSchema.parse(pardon);
    const stmt = this.db.prepare(`
      INSERT INTO pardon_waivers (
        id, rule_id, target_series_id, target_episode_id, target_scene_id, target_shot_id,
        target_entity_id, authorizer_id, reason, granted_against_entity_hash,
        granted_against_canon_root, injected_mutation_json, created_at_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.id,
      validated.rule_id,
      validated.target.series_id,
      validated.target.episode_id,
      validated.target.scene_id,
      validated.target.shot_id || null,
      validated.target.entity_id,
      validated.authorizer_id,
      validated.reason,
      validated.granted_against_entity_hash,
      validated.granted_against_canon_root,
      validated.injected_state_mutation ? JSON.stringify(validated.injected_state_mutation) : null,
      epochMs
    );
  }

  public getPardonsForEntity(entityId: string): PardonRecord[] {
    const rows = this.db.prepare("SELECT * FROM pardon_waivers WHERE target_entity_id = ?").all(entityId) as any[];
    return rows.map((r) => ({
      id: r.id,
      target: {
        series_id: r.target_series_id,
        episode_id: r.target_episode_id,
        scene_id: r.target_scene_id,
        shot_id: r.target_shot_id || undefined,
        entity_id: r.target_entity_id,
      },
      rule_id: r.rule_id,
      authorizer_id: r.authorizer_id,
      reason: r.reason,
      granted_against_entity_hash: r.granted_against_entity_hash,
      granted_against_canon_root: r.granted_against_canon_root,
      injected_state_mutation: r.injected_mutation_json ? JSON.parse(r.injected_mutation_json) : undefined,
    }));
  }

  public close(): void {
    this.db.close();
  }
}
