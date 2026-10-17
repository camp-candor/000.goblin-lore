import Database from 'better-sqlite3'
import * as fs from 'node:fs'
import * as path from 'node:path'

export interface FactRecord {
    id: string
    claim_text: string
    scope: 'CHARACTER' | 'LOCATION' | 'LOGISTIC' | 'LAW'
    authority_level?:
        | 'AXIOM'
        | 'CANON'
        | 'EVENT'
        | 'RUNTIME_STATE'
        | 'PROJECTION'
        | 'SPECULATION'
    standing?: 'ACTIVE_ENDORSED' | 'FLAGGED_FOR_REVIEW' | 'DEPRECATED_ARCHIVED'
    version: number
    author: string
    created_at_ms: number
    last_edited_at_ms: number
}

export interface DirtySceneTrace {
    scene_id: string
    episode_num: number
    scene_num: number
    fact_id: string
    pinned_version: number
    current_version: number
}

export class LocalRelationalCore {
    public db: Database.Database

    constructor(dbPath: string = ':memory:') {
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON')
        this.runMigrations()
    }

    private runMigrations(): void {
        const migrationPath = path.resolve(
            __dirname,
            '../../migrations/0001_phase0_flat_schema.sql',
        )
        const ddl = fs.readFileSync(migrationPath, 'utf8')
        this.db.exec(ddl)
    }

    public insertFact(fact: FactRecord): void {
        const stmt = this.db.prepare(`
      INSERT INTO facts (
        id, claim_text, scope, authority_level, standing, version, author, created_at_ms, last_edited_at_ms
      ) VALUES (
        @id, @claim_text, @scope,
        COALESCE(@authority_level, 'CANON'),
        COALESCE(@standing, 'ACTIVE_ENDORSED'),
        @version, @author, @created_at_ms, @last_edited_at_ms
      )
    `)
        stmt.run({
            authority_level: 'CANON',
            standing: 'ACTIVE_ENDORSED',
            ...fact,
        })
    }

    public bumpFactVersion(factId: string, newVersion: number): void {
        const stmt = this.db.prepare(`
      UPDATE facts
      SET version = ?, last_edited_at_ms = ?
      WHERE id = ?
    `)
        stmt.run(newVersion, Date.now(), factId)
    }

    public setFactStanding(
        factId: string,
        standing:
            'ACTIVE_ENDORSED' | 'FLAGGED_FOR_REVIEW' | 'DEPRECATED_ARCHIVED',
    ): void {
        const stmt = this.db.prepare(`
      UPDATE facts
      SET standing = ?, last_edited_at_ms = ?
      WHERE id = ?
    `)
        stmt.run(standing, Date.now(), factId)
    }

    public registerScene(
        scene: {
            id: string
            episode_num: number
            scene_num: number
            text: string
        },
        dependencies: Array<{ factId: string; pinnedVersion: number }>,
    ): void {
        const insertScene = this.db.prepare(`
      INSERT INTO scenes (id, episode_num, scene_num, text, status, is_dirty)
      VALUES (?, ?, ?, ?, 'clean', 0)
    `)
        const insertDep = this.db.prepare(`
      INSERT INTO scene_fact_dependencies (scene_id, fact_id, pinned_version, created_at_ms)
      VALUES (?, ?, ?, ?)
    `)

        const tx = this.db.transaction(() => {
            insertScene.run(
                scene.id,
                scene.episode_num,
                scene.scene_num,
                scene.text,
            )
            for (const dep of dependencies) {
                insertDep.run(
                    scene.id,
                    dep.factId,
                    dep.pinnedVersion,
                    Date.now(),
                )
            }
        })
        tx()
    }

    /**
     * Recursive Common Table Expression (CTE) tracing blast radius for why-dirty CLI
     */
    public queryWhyDirty(factId: string): DirtySceneTrace[] {
        const query = this.db.prepare(`
      WITH RECURSIVE dirty_cte AS (
        SELECT
          s.id AS scene_id,
          s.episode_num,
          s.scene_num,
          d.fact_id,
          d.pinned_version,
          f.version AS current_version
        FROM scenes s
        JOIN scene_fact_dependencies d ON s.id = d.scene_id
        JOIN facts f ON d.fact_id = f.id
        WHERE f.id = ? AND (d.pinned_version < f.version OR f.standing = 'DEPRECATED_ARCHIVED')
      )
      SELECT * FROM dirty_cte;
    `)

        return query.all(factId) as DirtySceneTrace[]
    }

    public close(): void {
        this.db.close()
    }
}
