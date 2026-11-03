import DatabaseConstructor from 'better-sqlite3';
import type { Database as DatabaseType } from 'better-sqlite3';
import { SOMATIC_LEDGER_SQL_DDL } from '../val/sqliteSomaticStore.val.js';
import type { ExtractedSomaticLedgerRecordBit } from '../fce/somaticLedger.bit.js';
import { assertIntegerMetric } from '../val/conditionsRegistry.val.js';

export interface PressureMeterRecord {
  meterId: string;
  entityId: string;
  category: 'SOMATIC_FATIGUE' | 'PHYSICAL_PAIN' | 'REFUSAL_STRAIN' | 'PARANOIA_CLOCK';
  currentValueBp: number;
  baselineBp: number;
  decayRatePerCycleBp: number;
  thresholdLimitBp: number;
  isBroken: boolean;
  updatedAtEpoch: number;
}

export class SqliteSomaticStore {
  private db: DatabaseType;

  constructor(dbPath: string = ':memory:') {
    this.db = new DatabaseConstructor(dbPath);
    this.initializeSchema();
  }

  public initializeSchema(): void {
    this.db.exec(SOMATIC_LEDGER_SQL_DDL);
  }

  public upsertSomaticLedgerRecord(record: ExtractedSomaticLedgerRecordBit, epoch: number = 0): void {
    assertIntegerMetric(record.availableArmsBps, 'availableArmsBps');
    assertIntegerMetric(record.chronicFatigueFloorBps, 'chronicFatigueFloorBps');
    assertIntegerMetric(record.chronicPainFloorBps, 'chronicPainFloorBps');
    assertIntegerMetric(record.chronicRefusalStrainFloorBps, 'chronicRefusalStrainFloorBps');
    assertIntegerMetric(record.chronicParanoiaFloorBps, 'chronicParanoiaFloorBps');

    const stmt = this.db.prepare(`
      INSERT INTO entities_somatic_live (
        entity_id, locomotion_baseline, available_arms_bps, arms_available, legs_available,
        locomotion_tier, chronic_fatigue_floor_bps, chronic_pain_floor_bps,
        chronic_refusal_strain_floor_bps, chronic_paranoia_floor_bps, active_conditions_json,
        banned_verbs_json, auditory_debuff_cdb, dsp_deltas_json, source_dossier_path,
        content_sha256, updated_at_epoch
      ) VALUES (
        @entityId, @locomotionBaseline, @availableArmsBps, @armsAvailable, @legsAvailable,
        @locomotionTier, @chronicFatigueFloorBps, @chronicPainFloorBps,
        @chronicRefusalStrainFloorBps, @chronicParanoiaFloorBps, @activeConditionsJson,
        @bannedVerbsJson, @auditoryDebuffCdB, @dspDeltasJson, @sourceDossierPath,
        @contentSha256, @epoch
      )
      ON CONFLICT(entity_id) DO UPDATE SET
        locomotion_baseline = excluded.locomotion_baseline,
        available_arms_bps = excluded.available_arms_bps,
        arms_available = excluded.arms_available,
        legs_available = excluded.legs_available,
        locomotion_tier = excluded.locomotion_tier,
        chronic_fatigue_floor_bps = excluded.chronic_fatigue_floor_bps,
        chronic_pain_floor_bps = excluded.chronic_pain_floor_bps,
        chronic_refusal_strain_floor_bps = excluded.chronic_refusal_strain_floor_bps,
        chronic_paranoia_floor_bps = excluded.chronic_paranoia_floor_bps,
        active_conditions_json = excluded.active_conditions_json,
        banned_verbs_json = excluded.banned_verbs_json,
        auditory_debuff_cdb = excluded.auditory_debuff_cdb,
        dsp_deltas_json = excluded.dsp_deltas_json,
        source_dossier_path = excluded.source_dossier_path,
        content_sha256 = excluded.content_sha256,
        updated_at_epoch = excluded.updated_at_epoch
    `);

    stmt.run({
      entityId: record.entityId,
      locomotionBaseline: record.locomotionBaseline,
      availableArmsBps: record.availableArmsBps,
      armsAvailable: record.armsAvailable,
      legsAvailable: record.legsAvailable,
      locomotionTier: record.locomotionTier,
      chronicFatigueFloorBps: record.chronicFatigueFloorBps,
      chronicPainFloorBps: record.chronicPainFloorBps,
      chronicRefusalStrainFloorBps: record.chronicRefusalStrainFloorBps,
      chronicParanoiaFloorBps: record.chronicParanoiaFloorBps,
      activeConditionsJson: JSON.stringify(record.activeConditions),
      bannedVerbsJson: JSON.stringify(record.bannedVerbs),
      auditoryDebuffCdB: record.auditoryDebuffCdB,
      dspDeltasJson: JSON.stringify(record.baselineDspDeltas),
      sourceDossierPath: record.sourceDossierPath,
      contentSha256: record.contentSha256,
      epoch,
    });
  }

  public queryCharacterSomaticLedger(entityId: string): ExtractedSomaticLedgerRecordBit | null {
    const row = this.db.prepare('SELECT * FROM entities_somatic_live WHERE entity_id = ?').get(entityId) as any;
    if (!row) return null;

    return Object.freeze({
      entityId: row.entity_id,
      locomotionBaseline: row.locomotion_baseline,
      availableArmsBps: row.available_arms_bps,
      armsAvailable: row.arms_available,
      legsAvailable: row.legs_available,
      locomotionTier: row.locomotion_tier,
      chronicFatigueFloorBps: row.chronic_fatigue_floor_bps,
      chronicPainFloorBps: row.chronic_pain_floor_bps,
      chronicRefusalStrainFloorBps: row.chronic_refusal_strain_floor_bps,
      chronicParanoiaFloorBps: row.chronic_paranoia_floor_bps,
      activeConditions: Object.freeze(JSON.parse(row.active_conditions_json)),
      bannedVerbs: Object.freeze(JSON.parse(row.banned_verbs_json)),
      auditoryDebuffCdB: row.auditory_debuff_cdb,
      baselineDspDeltas: Object.freeze(JSON.parse(row.dsp_deltas_json)),
      sourceDossierPath: row.source_dossier_path,
      contentSha256: row.content_sha256,
    });
  }

  public listSeriesSomaticLedger(): ExtractedSomaticLedgerRecordBit[] {
    const rows = this.db.prepare('SELECT * FROM entities_somatic_live ORDER BY entity_id ASC').all() as any[];
    return rows.map((row) =>
      Object.freeze({
        entityId: row.entity_id,
        locomotionBaseline: row.locomotion_baseline,
        availableArmsBps: row.available_arms_bps,
        armsAvailable: row.arms_available,
        legsAvailable: row.legs_available,
        locomotionTier: row.locomotion_tier,
        chronicFatigueFloorBps: row.chronic_fatigue_floor_bps,
        chronicPainFloorBps: row.chronic_pain_floor_bps,
        chronicRefusalStrainFloorBps: row.chronic_refusal_strain_floor_bps,
        chronicParanoiaFloorBps: row.chronic_paranoia_floor_bps,
        activeConditions: Object.freeze(JSON.parse(row.active_conditions_json)),
        bannedVerbs: Object.freeze(JSON.parse(row.banned_verbs_json)),
        auditoryDebuffCdB: row.auditory_debuff_cdb,
        baselineDspDeltas: Object.freeze(JSON.parse(row.dsp_deltas_json)),
        sourceDossierPath: row.source_dossier_path,
        contentSha256: row.content_sha256,
      }),
    );
  }

  public upsertPressureMeter(record: PressureMeterRecord): void {
    assertIntegerMetric(record.currentValueBp, 'currentValueBp');
    assertIntegerMetric(record.baselineBp, 'baselineBp');
    assertIntegerMetric(record.decayRatePerCycleBp, 'decayRatePerCycleBp');
    assertIntegerMetric(record.thresholdLimitBp, 'thresholdLimitBp');

    const stmt = this.db.prepare(`
      INSERT INTO pressure_meters_live (
        meter_id, entity_id, category, current_value_bp, baseline_bp,
        decay_rate_per_cycle_bp, threshold_limit_bp, is_broken, updated_at_epoch
      ) VALUES (
        @meterId, @entityId, @category, @currentValueBp, @baselineBp,
        @decayRatePerCycleBp, @thresholdLimitBp, @isBroken, @updatedAtEpoch
      )
      ON CONFLICT(entity_id, category) DO UPDATE SET
        current_value_bp = excluded.current_value_bp,
        baseline_bp = excluded.baseline_bp,
        decay_rate_per_cycle_bp = excluded.decay_rate_per_cycle_bp,
        threshold_limit_bp = excluded.threshold_limit_bp,
        is_broken = excluded.is_broken,
        updated_at_epoch = excluded.updated_at_epoch
    `);

    stmt.run({
      meterId: record.meterId,
      entityId: record.entityId,
      category: record.category,
      currentValueBp: record.currentValueBp,
      baselineBp: record.baselineBp,
      decayRatePerCycleBp: record.decayRatePerCycleBp,
      thresholdLimitBp: record.thresholdLimitBp,
      isBroken: record.isBroken ? 1 : 0,
      updatedAtEpoch: record.updatedAtEpoch,
    });
  }

  public close(): void {
    this.db.close();
  }
}
