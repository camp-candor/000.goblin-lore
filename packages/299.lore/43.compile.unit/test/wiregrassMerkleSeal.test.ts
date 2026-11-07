import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import State from '../../99.core/state.js';
import { CompileModel } from '../compile.model.js';
import {
  runCompile,
  pass3Seal,
  offlineDeletionTest,
  gate0Verify,
  jcsSerialize,
} from '../buz/compile.buzz.js';
import { MenuModel } from '../../98.menu.unit/menu.model.js';
import { triggerCompileAction } from '../../98.menu.unit/buz/00.menu.buzz.js';

describe('43.compile.unit :: Wiregrass Basin Merkle Seal & Hermetic Parity', () => {
  const repoRoot = path.resolve(__dirname, '../../../../');
  const canonicalBiblePath = path.join(
    repoRoot,
    'compiled/wiregrass-basin/bible-state.json',
  );

  it('mints compiled/wiregrass-basin/bible-state.json with valid RFC 8785 JCS Merkle root H_root', () => {
    const model = new CompileModel();
    let sealBit: any;

    pass3Seal(model, {
      idx: 'test-seal-wiregrass',
      seriesSlug: 'wiregrass-basin',
      slv: (res: any) => {
        sealBit = res.cmpBit;
      },
    });

    expect(sealBit).toBeDefined();
    expect(sealBit.val).toBe(1);
    expect(model.status).toBe('SEALED');
    expect(fs.existsSync(canonicalBiblePath)).toBe(true);

    const onDisk = JSON.parse(fs.readFileSync(canonicalBiblePath, 'utf8'));
    expect(onDisk.schema_version).toBe('1.0.0');
    expect(onDisk.series_slug).toBe('wiregrass-basin');
    expect(onDisk.root_merkle_hash).toMatch(/^[0-9a-f]{64}$/);
    expect(onDisk.root_merkle_hash).toBe(sealBit.rootMerkleHash);
    expect(onDisk.catalog_summary.totalEntities).toBe(9);

    const preSealPayload = {
      schema_version: onDisk.schema_version,
      series_slug: onDisk.series_slug,
      catalog_summary: onDisk.catalog_summary,
      entity_hashes: onDisk.entity_hashes,
      entities: onDisk.entities,
    };
    const recomputedHash = crypto
      .createHash('sha256')
      .update(jcsSerialize(preSealPayload, true), 'utf8')
      .digest('hex');

    expect(recomputedHash).toBe(onDisk.root_merkle_hash);
    expect(Object.isFrozen(model.entityCatalog)).toBe(true);
  });

  it('verifies bit-for-bit hermetic offline deletion and rebuild parity for wiregrass-basin', () => {
    const model = new CompileModel();
    let parityBit: any;

    offlineDeletionTest(model, {
      idx: 'test-hermetic-wiregrass',
      seriesSlug: 'wiregrass-basin',
      slv: (res: any) => {
        parityBit = res.cmpBit;
      },
    });

    expect(parityBit).toBeDefined();
    expect(parityBit.val).toBe(1);
    expect(parityBit.offlineParityReport.parityVerified).toBe(true);
    expect(parityBit.offlineParityReport.initialHash).toMatch(/^[0-9a-f]{64}$/);
    expect(parityBit.offlineParityReport.rebuiltHash).toBe(
      parityBit.offlineParityReport.initialHash,
    );
  });

  it('certifies wiregrass-basin through Gate 0 verification gauntlet', () => {
    const model = new CompileModel();
    let gateBit: any;

    gate0Verify(model, {
      idx: 'test-gate0-wiregrass',
      seriesSlug: 'wiregrass-basin',
      slv: (res: any) => {
        gateBit = res.cmpBit;
      },
    });

    expect(gateBit).toBeDefined();
    expect(gateBit.val).toBe(1);
    expect(model.status).toBe('SEALED');
    expect(gateBit.validationReport.errors).toEqual([]);
    expect(gateBit.stylometricReport.passed).toBe(true);
  });

  it('dispatches wiregrass-basin compilation cleanly through 98.menu.unit triggerCompileAction', async () => {
    const liveState = new State();
    const menuModel = new MenuModel();
    let resolved: any = null;

    await triggerCompileAction(
      menuModel,
      {
        idx: 'test-menu-compile-wiregrass',
        val: 0,
        dat: { activeSeries: 'wiregrass-basin' },
        slv: (res: any) => {
          resolved = res;
        },
      } as any,
      liveState,
    );

    expect(resolved).toBeDefined();
    expect(resolved.mnuBit.val).toBe(0);
    expect(resolved.mnuBit.dat.success).toBe(true);
    expect(resolved.mnuBit.dat.resBit.catalogSummary.totalEntities).toBe(9);
  });
});
