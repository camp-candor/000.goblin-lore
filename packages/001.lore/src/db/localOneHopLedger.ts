import Database from 'better-sqlite3';
import { OneHopDependencySet } from '../schemas/dependencyHash.schema.js';

export class LocalOneHopLedger {
  private db: Database.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS one_hop_sets (
        target_id TEXT PRIMARY KEY,
        target_content_hash TEXT NOT NULL,
        computed_h_dep TEXT NOT NULL,
        pinned_at_epoch INTEGER NOT NULL
      );
    `);
  }

  public storeOneHopDependencySet(set: OneHopDependencySet): void {
    const stmt = this.db.prepare(`
      INSERT INTO one_hop_sets (target_id, target_content_hash, computed_h_dep, pinned_at_epoch)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(target_id) DO UPDATE SET
        target_content_hash = excluded.target_content_hash,
        computed_h_dep = excluded.computed_h_dep,
        pinned_at_epoch = excluded.pinned_at_epoch
    `);
    stmt.run(set.target_id, set.target_content_hash, set.computed_h_dep, set.pinned_at_epoch);
  }

  public getStoredHdep(targetId: string): string | null {
    const stmt = this.db.prepare('SELECT computed_h_dep FROM one_hop_sets WHERE target_id = ?');
    const row = stmt.get(targetId) as { computed_h_dep: string } | undefined;
    return row ? row.computed_h_dep : null;
  }

  public getEntityContentHash(targetId: string): string | null {
    const stmt = this.db.prepare('SELECT target_content_hash FROM one_hop_sets WHERE target_id = ?');
    const row = stmt.get(targetId) as { target_content_hash: string } | undefined;
    return row ? row.target_content_hash : null;
  }

  public close(): void {
    this.db.close();
  }
}
