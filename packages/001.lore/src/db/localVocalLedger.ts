import Database from 'better-sqlite3'
import { CharacterVocalProfileSchema } from '../schemas/somaticTrauma.js'
import type { CharacterVocalProfile } from '../schemas/somaticTrauma.js'

export class LocalVocalLedger {
    public db: Database.Database

    constructor(dbPath: string = ':memory:') {
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON')
        this.initSchema()
    }

    private initSchema(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS character_vocal_profiles (
        character_id TEXT PRIMARY KEY,
        vitality_bps INTEGER NOT NULL CHECK(vitality_bps BETWEEN 0 AND 10000),
        is_conscious INTEGER NOT NULL DEFAULT 1,
        active_conditions_json TEXT NOT NULL DEFAULT '[]',
        banned_kinetic_verbs_json TEXT NOT NULL DEFAULT '[]',
        banned_cadences_json TEXT NOT NULL DEFAULT '[]',
        updated_at_epoch INTEGER NOT NULL DEFAULT 0
      );
    `)
    }

    public upsertProfile(profile: CharacterVocalProfile): void {
        const validated = CharacterVocalProfileSchema.parse(profile)
        const stmt = this.db.prepare(`
      INSERT INTO character_vocal_profiles (
        character_id, vitality_bps, is_conscious, active_conditions_json,
        banned_kinetic_verbs_json, banned_cadences_json, updated_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(character_id) DO UPDATE SET
        vitality_bps = excluded.vitality_bps,
        is_conscious = excluded.is_conscious,
        active_conditions_json = excluded.active_conditions_json,
        banned_kinetic_verbs_json = excluded.banned_kinetic_verbs_json,
        banned_cadences_json = excluded.banned_cadences_json,
        updated_at_epoch = excluded.updated_at_epoch;
    `)

        stmt.run(
            validated.character_id,
            validated.vitality_bps,
            validated.is_conscious ? 1 : 0,
            JSON.stringify(validated.active_conditions),
            JSON.stringify(validated.banned_kinetic_verbs),
            JSON.stringify(validated.banned_cadences),
            validated.updated_at_epoch,
        )
    }

    public getProfile(characterId: string): CharacterVocalProfile | undefined {
        const row = this.db
            .prepare(
                'SELECT * FROM character_vocal_profiles WHERE character_id = ?',
            )
            .get(characterId) as
            | {
                  character_id: string
                  vitality_bps: number
                  is_conscious: number
                  active_conditions_json: string
                  banned_kinetic_verbs_json: string
                  banned_cadences_json: string
                  updated_at_epoch: number
              }
            | undefined

        if (!row) return undefined

        return CharacterVocalProfileSchema.parse({
            character_id: row.character_id,
            vitality_bps: row.vitality_bps,
            is_conscious: row.is_conscious === 1,
            active_conditions: JSON.parse(row.active_conditions_json),
            banned_kinetic_verbs: JSON.parse(row.banned_kinetic_verbs_json),
            banned_cadences: JSON.parse(row.banned_cadences_json),
            updated_at_epoch: row.updated_at_epoch,
        })
    }

    public close(): void {
        this.db.close()
    }
}
