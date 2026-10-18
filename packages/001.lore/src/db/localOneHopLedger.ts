import Database from 'better-sqlite3';

export class LocalOneHopLedger {
  private db: Database.Database;

  constructor(filename: string) {
    this.db = new Database(filename);
    this.init();
  }

  private init() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS one_hop_dependencies (
        target_id TEXT PRIMARY KEY,
        target_content_hash TEXT NOT NULL,
        computed_h_dep TEXT NOT NULL,
        pinned_at_epoch INTEGER NOT NULL
      );
      CREATE TABLE IF NOT EXISTS foreign_keys (
        target_id TEXT NOT NULL,
        entity_id TEXT NOT NULL,
        content_hash TEXT NOT NULL,
        updated_at_epoch INTEGER NOT NULL,
        FOREIGN KEY(target_id) REFERENCES one_hop_dependencies(target_id)
      );
    `);
  }

  storeOneHopDependencySet(depSet: any) {
    const stmt = this.db.prepare(
      'INSERT OR REPLACE INTO one_hop_dependencies (target_id, target_content_hash, computed_h_dep, pinned_at_epoch) VALUES (?, ?, ?, ?)'
    );
    stmt.run(depSet.target_id, depSet.target_content_hash, depSet.computed_h_dep, depSet.pinned_at_epoch);

    const deleteFks = this.db.prepare('DELETE FROM foreign_keys WHERE target_id = ?');
    deleteFks.run(depSet.target_id);

    const insertFk = this.db.prepare(
      'INSERT INTO foreign_keys (target_id, entity_id, content_hash, updated_at_epoch) VALUES (?, ?, ?, ?)'
    );
    for (const fk of depSet.foreign_keys) {
      insertFk.run(depSet.target_id, fk.entity_id, fk.content_hash, fk.updated_at_epoch);
    }
  }

  getStoredHdep(targetId: string): string | null {
    const stmt = this.db.prepare('SELECT computed_h_dep FROM one_hop_dependencies WHERE target_id = ?');
    const row = stmt.get(targetId) as { computed_h_dep: string } | undefined;
    return row ? row.computed_h_dep : null;
  }

  getEntityContentHash(targetId: string): string | null {
    const stmt = this.db.prepare('SELECT target_content_hash FROM one_hop_dependencies WHERE target_id = ?');
    const row = stmt.get(targetId) as { target_content_hash: string } | undefined;
    return row ? row.target_content_hash : null;
  }

  close() {
    this.db.close();
  }
}
