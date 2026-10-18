import Database from 'better-sqlite3'
import * as crypto from 'node:crypto'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { PardonRecord, PardonRecordSchema } from '../../schemas/pardon.schema'

export interface TamperCheckResult {
    intact: boolean
    isEntityStale: boolean
    isCanonRootStale: boolean
    currentEntityHash: string
    expectedEntityHash: string
    currentCanonRoot: string
    expectedCanonRoot: string
    reason?: string
}

export class LocalPardonLedger {
    public db: Database.Database

    constructor(dbPath: string = ':memory:') {
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON')
        this.initSchema()
    }

    private initSchema(): void {
        const migrationPath = path.resolve(
            __dirname,
            '../../migrations/0003_pardon_ledger.sql',
        )
        if (fs.existsSync(migrationPath)) {
            const ddl = fs.readFileSync(migrationPath, 'utf8')
            this.db.exec(ddl)
        } else {
            // Inline fail-safe DDL matching migration specification
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
          granted_against_entity_hash TEXT NOT NULL CHECK(length(granted_against_entity_hash) == 64),
          granted_against_canon_root TEXT NOT NULL CHECK(length(granted_against_canon_root) == 64),
          injected_mutation_json TEXT,
          created_at_ms INTEGER NOT NULL CHECK(created_at_ms >= 0),
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
      `)
        }
    }

    /**
     * Computes normalized NFC SHA-256 hash of an entity payload
     */
    public static computeEntityHash(payload: unknown): string {
        const canonicalString = JSON.stringify(payload).normalize('NFC')
        return crypto.createHash('sha256').update(canonicalString).digest('hex')
    }

    /**
     * Records a validated pardon into local SQLite.
     * Throws SQLite check-constraint error if rule is unpardonable.
     */
    public recordPardon(
        pardon: PardonRecord,
        epochMs: number = Date.now(),
    ): void {
        const validated = PardonRecordSchema.parse(pardon)

        const stmt = this.db.prepare(`
      INSERT INTO pardon_waivers (
        id, rule_id, target_series_id, target_episode_id, target_scene_id, target_shot_id,
        target_entity_id, authorizer_id, reason, granted_against_entity_hash,
        granted_against_canon_root, injected_mutation_json, created_at_ms
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)

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
            validated.injected_state_mutation
                ? JSON.stringify(validated.injected_state_mutation)
                : null,
            epochMs,
        )
    }

    /**
     * Retrieves all active pardons targeting a specific entity ID
     */
    public getPardonsForEntity(entityId: string): PardonRecord[] {
        const rows = this.db
            .prepare('SELECT * FROM pardon_waivers WHERE target_entity_id = ?')
            .all(entityId) as any[]

        return rows.map((r) => this.mapRowToPardon(r))
    }

    /**
     * Retrieves all active pardons scoped to a specific scene
     */
    public getPardonsForScene(
        seriesId: string,
        episodeId: string,
        sceneId: string,
    ): PardonRecord[] {
        const rows = this.db
            .prepare(
                `SELECT * FROM pardon_waivers
         WHERE target_series_id = ? AND target_episode_id = ? AND target_scene_id = ?`,
            )
            .all(seriesId, episodeId, sceneId) as any[]

        return rows.map((r) => this.mapRowToPardon(r))
    }

    /**
     * Counts the number of active waivers issued against a specific rule ID
     */
    public countWaiversByRule(ruleId: string): number {
        const row = this.db
            .prepare(
                'SELECT COUNT(*) AS total FROM pardon_waivers WHERE rule_id = ?',
            )
            .get(ruleId) as { total: number }
        return row ? row.total : 0
    }

    /**
     * Tamper Guard: Evaluates cryptographic entity-state and canon-root integrity
     */
    public verifyPardonTamperIntegrity(
        pardonId: string,
        currentEntityPayload: unknown,
        currentCanonRoot: string,
    ): TamperCheckResult {
        const row = this.db
            .prepare('SELECT * FROM pardon_waivers WHERE id = ?')
            .get(pardonId) as any

        if (!row) {
            throw new Error(
                `PARDON_NOT_FOUND: Waiver '${pardonId}' does not exist in local ledger.`,
            )
        }

        const currentEntityHash =
            LocalPardonLedger.computeEntityHash(currentEntityPayload)
        const expectedEntityHash = row.granted_against_entity_hash
        const isEntityStale = currentEntityHash !== expectedEntityHash

        const expectedCanonRoot = row.granted_against_canon_root
        const isCanonRootStale = currentCanonRoot !== expectedCanonRoot

        if (isEntityStale) {
            return {
                intact: false,
                isEntityStale: true,
                isCanonRootStale,
                currentEntityHash,
                expectedEntityHash,
                currentCanonRoot,
                expectedCanonRoot,
                reason: `ENTITY_STATE_TAMPER_DETECTED: Target entity state has drifted. Expected ${expectedEntityHash.slice(0, 8)}..., calculated ${currentEntityHash.slice(0, 8)}...`,
            }
        }

        if (isCanonRootStale) {
            return {
                intact: false,
                isEntityStale: false,
                isCanonRootStale: true,
                currentEntityHash,
                expectedEntityHash,
                currentCanonRoot,
                expectedCanonRoot,
                reason: `CANON_ROOT_TAMPER_DETECTED: Canon root hash mismatch. Expected ${expectedCanonRoot.slice(0, 8)}..., current ${currentCanonRoot.slice(0, 8)}...`,
            }
        }

        return {
            intact: true,
            isEntityStale: false,
            isCanonRootStale: false,
            currentEntityHash,
            expectedEntityHash,
            currentCanonRoot,
            expectedCanonRoot,
        }
    }

    private mapRowToPardon(r: any): PardonRecord {
        return {
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
            injected_state_mutation: r.injected_mutation_json
                ? JSON.parse(r.injected_mutation_json)
                : undefined,
        }
    }

    public close(): void {
        this.db.close()
    }
}
