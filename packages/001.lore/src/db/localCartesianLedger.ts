import Database from 'better-sqlite3'
import {
    PhysicalWorldEvent,
    Percept,
    BeliefRecord,
} from '../../schemas/cartesian.js'

export class LocalCartesianLedger {
    public db: Database.Database

    constructor(dbPath: string = ':memory:') {
        this.db = new Database(dbPath)
        this.db.pragma('foreign_keys = ON')
        this.initSchema()
    }

    private initSchema(): void {
        this.db.exec(`
      CREATE TABLE IF NOT EXISTS physical_events (
        id TEXT PRIMARY KEY,
        location_id TEXT NOT NULL,
        initiator_id TEXT NOT NULL,
        action_verb TEXT NOT NULL,
        target_id TEXT,
        sound_power_cb INTEGER NOT NULL,
        optical_signature_lux INTEGER NOT NULL,
        is_silent INTEGER NOT NULL DEFAULT 0,
        tick INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS sensory_percepts (
        id TEXT PRIMARY KEY,
        observer_id TEXT NOT NULL,
        source_event_id TEXT NOT NULL,
        modality TEXT CHECK(modality IN ('VISUAL', 'AUDITORY', 'OLFACTORY', 'TACTILE')) NOT NULL,
        perceived_intensity_bps INTEGER NOT NULL,
        received_snr_cb INTEGER NOT NULL,
        apparent_location_id TEXT NOT NULL,
        tick INTEGER NOT NULL,
        FOREIGN KEY (source_event_id) REFERENCES physical_events(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS actor_beliefs (
        id TEXT PRIMARY KEY,
        actor_id TEXT NOT NULL,
        subject_entity_id TEXT NOT NULL,
        attribute_or_action TEXT NOT NULL,
        believed_value TEXT NOT NULL,
        confidence_bps INTEGER NOT NULL,
        source_type TEXT NOT NULL,
        formed_at_tick INTEGER NOT NULL
      );
    `)
    }

    public recordPhysicalEvent(event: PhysicalWorldEvent): void {
        const stmt = this.db.prepare(`
      INSERT INTO physical_events (
        id, location_id, initiator_id, action_verb, target_id,
        sound_power_cb, optical_signature_lux, is_silent, tick
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
        stmt.run(
            event.id,
            event.location_id,
            event.initiator_id,
            event.action_verb,
            event.target_id || null,
            event.sound_power_cb,
            event.optical_signature_lux,
            event.is_silent ? 1 : 0,
            event.tick,
        )
    }

    public recordPercept(percept: Percept): void {
        const stmt = this.db.prepare(`
      INSERT INTO sensory_percepts (
        id, observer_id, source_event_id, modality,
        perceived_intensity_bps, received_snr_cb, apparent_location_id, tick
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
        stmt.run(
            percept.id,
            percept.observer_id,
            percept.source_event_id,
            percept.modality,
            percept.perceived_intensity_bps,
            percept.received_snr_cb,
            percept.apparent_location_id,
            percept.tick,
        )
    }

    public recordBelief(belief: BeliefRecord): void {
        const stmt = this.db.prepare(`
      INSERT INTO actor_beliefs (
        id, actor_id, subject_entity_id, attribute_or_action,
        believed_value, confidence_bps, source_type, formed_at_tick
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
        stmt.run(
            belief.id,
            belief.actor_id,
            belief.subject_entity_id,
            belief.attribute_or_action,
            belief.believed_value,
            belief.confidence_bps,
            belief.source_type,
            belief.formed_at_tick,
        )
    }

    public getActorBeliefs(actorId: string): BeliefRecord[] {
        const rows = this.db
            .prepare('SELECT * FROM actor_beliefs WHERE actor_id = ?')
            .all(actorId) as Array<{
            id: string
            actor_id: string
            subject_entity_id: string
            attribute_or_action: string
            believed_value: string
            confidence_bps: number
            source_type: BeliefRecord['source_type']
            formed_at_tick: number
        }>

        return rows.map((r) => ({
            ...r,
            grounding_percept_ids: [],
        }))
    }

    public close(): void {
        this.db.close()
    }
}
