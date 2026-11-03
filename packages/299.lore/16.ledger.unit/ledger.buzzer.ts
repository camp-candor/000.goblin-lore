import type { LedgerModel } from './ledger.model.js';
import type LedgerBit from './fce/ledger.bit.js';
import type State from '../99.core/state.js';
import {
  loadConditionsCatalogFromDisk,
  extractCharacterSomaticRecord,
} from './buz/extractSomaticLedger.buzz.js';
import { SqliteSomaticStore } from './buz/sqliteSomaticStore.buzz.js';

const UPDATE_CONSOLE = '[Console action] Update Console';

export const initLedger = (cpy: LedgerModel, bal: LedgerBit, ste: State): LedgerModel => {
  cpy.conditionsCatalog = {};
  cpy.somaticRecords = {};
  if (!cpy.sqliteStore) {
    cpy.sqliteStore = new SqliteSomaticStore(':memory:');
  }
  if (bal?.slv) {
    bal.slv({ ldgBit: { idx: 'init-ledger-ok', val: 1 } });
  }
  return cpy;
};

export const updateLedger = (cpy: LedgerModel, bal: LedgerBit, ste: State): LedgerModel => {
  if (bal?.slv) {
    bal.slv({ ldgBit: { idx: 'update-ledger-ok', val: 1 } });
  }
  return cpy;
};

export const extractSomaticLedger = async (
  cpy: LedgerModel,
  bal: LedgerBit<{ conditionsPath: string; characterPaths: string[] }>,
  ste: State,
): Promise<LedgerModel> => {
  const payload = bal.dat;
  if (!payload || !payload.conditionsPath || !payload.characterPaths) {
    if (bal.slv) {
      bal.slv({ ldgBit: { idx: 'extract-somatic-ledger-fail', val: -1 } });
    }
    return cpy;
  }

  if (!cpy.sqliteStore) {
    cpy.sqliteStore = new SqliteSomaticStore(':memory:');
  }

  try {
    const catalogMap = loadConditionsCatalogFromDisk(payload.conditionsPath);
    cpy.conditionsCatalog = Object.fromEntries(catalogMap);

    const extracted: Record<string, any> = {};
    for (const charPath of payload.characterPaths) {
      const record = extractCharacterSomaticRecord(charPath, catalogMap);
      extracted[record.entityId] = record;
      cpy.somaticRecords[record.entityId] = record;
      cpy.sqliteStore.upsertSomaticLedgerRecord(record);
    }

    if (ste) {
      await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [SOMATIC_LEDGER] Extracted ${payload.characterPaths.length} character dossiers from disk [OK]`,
      });
    }

    if (bal.slv) {
      bal.slv({
        ldgBit: {
          idx: 'extract-somatic-ledger-ok',
          val: Object.keys(extracted).length,
          dat: Object.values(extracted),
        },
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (ste) {
      await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `:: [SOMATIC_LEDGER FAIL] ${message}`,
      });
    }
    if (bal.slv) {
      bal.slv({
        ldgBit: {
          idx: 'extract-somatic-ledger-err',
          val: -1,
          src: message,
        },
      });
    }
  }

  return cpy;
};

export const querySomaticLedgerRecord = (
  cpy: LedgerModel,
  bal: LedgerBit<{ entityId: string }>,
  ste: State,
): LedgerModel => {
  const entityId = bal.dat?.entityId;
  if (!entityId || !cpy.sqliteStore) {
    if (bal.slv) bal.slv({ ldgBit: { idx: 'query-ledger-fail', val: 0 } });
    return cpy;
  }

  const record = cpy.sqliteStore.queryCharacterSomaticLedger(entityId);
  if (bal.slv) {
    bal.slv({
      ldgBit: {
        idx: record ? 'query-ledger-ok' : 'query-ledger-not-found',
        val: record ? 1 : 0,
        dat: record || undefined,
      },
    });
  }
  return cpy;
};
