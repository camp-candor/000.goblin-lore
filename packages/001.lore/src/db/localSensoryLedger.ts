import Database from 'better-sqlite3'
import * as fs from 'node:fs'
import * as path from 'node:path'

export interface PhysicalEventInput {
    id: string
    room_id: string
    initiator_id: string
    action_verb: string
    target_id?: string | null
    sound_power_cdb: number
    optical_signature_lux: number
    is_silent: boolean
    tick: number
}

export interface CharacterSensoryProfile {
    actor_id: string
    visual_acuity: 'NORMAL' | 'MONOCULAR' | 'BLIND'
    hearing_threshold_cdb: number
    has_acoustic_trauma: boolean
    facing_direction?: number | null // 0 to 5
    is_unconscious: boolean
}

export interface SensoryPerceptRecord {
    id: string
    observer_id: string
    source_event_id: string
    modality: 'VISUAL' | 'AUDITORY' | 'OLFACTORY' | 'TACTILE'
    perceived_intensity_bps: number // 0 to 10000
    received_snr_cdb: number
    quality_score: number // 0 to 1000
    is_resolved: boolean
    apparent_location_id: string
    apparent_source_id?: string | null
    tick: number
}

export class LocalSensoryLedger {
    public db: Database.Database

    constructor(dbPath: string = ':memory:') {
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON')
        this.runMigrations()
    }

    private runMigrations(): void {
        const migrationPath = path.resolve(
            __dirname,
            '../../migrations/0003_sensory_percept_core.sql',
        )
        if (fs.existsSync(migrationPath)) {
            const ddl = fs.readFileSync(migrationPath, 'utf8')
            this.db.exec(ddl)
        } else {
            throw new Error(
                `MIGRATION_NOT_FOUND: Cannot find '${migrationPath}'.`,
            )
        }
    }

    public recordPhysicalEvent(event: PhysicalEventInput): void {
        const stmt = this.db.prepare(`
      INSERT INTO physical_events (
        id, room_id, initiator_id, action_verb, target_id,
        sound_power_cdb, optical_signature_lux, is_silent, tick, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        sound_power_cdb = excluded.sound_power_cdb,
        optical_signature_lux = excluded.optical_signature_lux,
        is_silent = excluded.is_silent;
    `)
        stmt.run(
            event.id,
            event.room_id,
            event.initiator_id,
            event.action_verb,
            event.target_id || null,
            event.sound_power_cdb,
            event.optical_signature_lux,
            event.is_silent ? 1 : 0,
            event.tick,
            0,
        )
    }

    public upsertSensoryProfile(profile: CharacterSensoryProfile): void {
        const stmt = this.db.prepare(`
      INSERT INTO character_sensory_profiles (
        actor_id, visual_acuity, hearing_threshold_cdb, has_acoustic_trauma,
        facing_direction, is_unconscious, updated_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(actor_id) DO UPDATE SET
        visual_acuity = excluded.visual_acuity,
        hearing_threshold_cdb = excluded.hearing_threshold_cdb,
        has_acoustic_trauma = excluded.has_acoustic_trauma,
        facing_direction = excluded.facing_direction,
        is_unconscious = excluded.is_unconscious,
        updated_at_epoch = excluded.updated_at_epoch;
    `)
        stmt.run(
            profile.actor_id,
            profile.visual_acuity,
            profile.hearing_threshold_cdb,
            profile.has_acoustic_trauma ? 1 : 0,
            profile.facing_direction ?? null,
            profile.is_unconscious ? 1 : 0,
            0,
        )
    }

    public recordPercept(percept: SensoryPerceptRecord): void {
        const stmt = this.db.prepare(`
      INSERT INTO sensory_percepts (
        id, observer_id, source_event_id, modality, perceived_intensity_bps,
        received_snr_cdb, quality_score, is_resolved, apparent_location_id,
        apparent_source_id, tick, created_at_epoch
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        perceived_intensity_bps = excluded.perceived_intensity_bps,
        received_snr_cdb = excluded.received_snr_cdb,
        quality_score = excluded.quality_score,
        is_resolved = excluded.is_resolved;
    `)
        stmt.run(
            percept.id,
            percept.observer_id,
            percept.source_event_id,
            percept.modality,
            percept.perceived_intensity_bps,
            percept.received_snr_cdb,
            percept.quality_score,
            percept.is_resolved ? 1 : 0,
            percept.apparent_location_id,
            percept.apparent_source_id || null,
            percept.tick,
            0,
        )
    }

    public getSensoryProfile(
        actorId: string,
    ): CharacterSensoryProfile | undefined {
        const row = this.db
            .prepare(
                `
      SELECT * FROM character_sensory_profiles WHERE actor_id = ?
    `,
            )
            .get(actorId) as any

        if (!row) return undefined
        return {
            actor_id: row.actor_id,
            visual_acuity: row.visual_acuity,
            hearing_threshold_cdb: row.hearing_threshold_cdb,
            has_acoustic_trauma: row.has_acoustic_trauma === 1,
            facing_direction: row.facing_direction,
            is_unconscious: row.is_unconscious === 1,
        }
    }

    public getObserverPercepts(
        observerId: string,
        tick?: number,
    ): SensoryPerceptRecord[] {
        let sql = `SELECT * FROM sensory_percepts WHERE observer_id = ?`
        const params: any[] = [observerId]

        if (tick !== undefined) {
            sql += ` AND tick = ?`
            params.push(tick)
        }

        const rows = this.db.prepare(sql).all(...params) as any[]
        return rows.map((r) => ({
            id: r.id,
            observer_id: r.observer_id,
            source_event_id: r.source_event_id,
            modality: r.modality,
            perceived_intensity_bps: r.perceived_intensity_bps,
            received_snr_cdb: r.received_snr_cdb,
            quality_score: r.quality_score,
            is_resolved: r.is_resolved === 1,
            apparent_location_id: r.apparent_location_id,
            apparent_source_id: r.apparent_source_id,
            tick: r.tick,
        }))
    }

    public close(): void {
        this.db.close()
    }
}
