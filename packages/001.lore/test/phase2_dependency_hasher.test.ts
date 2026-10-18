import { describe, it, expect } from 'vitest';
import {
  canonicalJsonStringify,
  computeEntityContentHash,
  computeDirectOneHopHdep,
  buildOneHopDependencySet,
  generateOneHopAdvisoryDiff
} from '../src/core/versioning/dependencyHasher.js';
import { LocalOneHopLedger } from '../src/db/localOneHopLedger.js';

describe('Dependency Hasher Phase 2', () => {
  it('should canonicalize JSON', () => {
    const objA = { z: 100, b: 2, a: { y: 'bar', x: 'foo' } };
    const objB = { a: { x: 'foo', y: 'bar' }, z: 100, b: 2 };
    expect(canonicalJsonStringify(objA)).toEqual(canonicalJsonStringify(objB));
  });

  it('should prevent zero byte poison', () => {
    expect(() => computeEntityContentHash('')).toThrow('CORRUPTED_ZERO_BYTE_ASSET');
    expect(() => computeEntityContentHash(Buffer.alloc(0))).toThrow('CORRUPTED_ZERO_BYTE_ASSET');
  });

  it('should correctly hash sets', () => {
    const target = 'a'.repeat(64);
    const fk1 = '1'.repeat(64);
    const fk2 = '2'.repeat(64);
    const fk3 = '3'.repeat(64);

    const hash1 = computeDirectOneHopHdep(target, [fk1, fk2, fk3]);
    const hash2 = computeDirectOneHopHdep(target, [fk3, fk1, fk2]);
    expect(hash1).toEqual(hash2);
  });

  it('should shield hub from invalidation', () => {
    const bog = { id: 'char_bog', name: 'Bog' };
    const knife = { id: 'item_iron_knife', weight_bps: 1000 };
    const pipe = { id: 'loc_warm_pipe', acoustic_damping_bps: 2500 };

    const initialBogSet = buildOneHopDependencySet('char_bog', bog, [
      { entity_id: 'item_iron_knife', payload: knife }
    ]);

    const activeHashes = new Map([
      ['char_bog', initialBogSet.target_content_hash],
      ['item_iron_knife', initialBogSet.foreign_keys[0].content_hash],
      ['loc_warm_pipe', computeEntityContentHash({ ...pipe, acoustic_damping_bps: 3000 })]
    ]);

    const advisory = generateOneHopAdvisoryDiff({
      targetId: 'char_bog',
      previousPinnedSet: initialBogSet,
      currentActiveHashes: activeHashes
    });

    expect(advisory.rebase_required).toBe(false);
    expect(advisory.current_h_dep).toEqual(initialBogSet.computed_h_dep);
  });

  it('should store in sqlite ledger', () => {
    const ledger = new LocalOneHopLedger(':memory:');
    const depSet = buildOneHopDependencySet('char_bog', { name: 'Bog' }, [
      { entity_id: 'item_knife', payload: { name: 'Knife' } }
    ]);

    ledger.storeOneHopDependencySet(depSet);
    const storedHdep = ledger.getStoredHdep('char_bog');
    const storedContentHash = ledger.getEntityContentHash('char_bog');

    ledger.close();

    expect(storedHdep).toEqual(depSet.computed_h_dep);
    expect(storedContentHash).toEqual(depSet.target_content_hash);
  });

  it('should detect direct foreign key mutation', () => {
    const bog = { id: 'char_bog', name: 'Bog' };
    const knifeV1 = { id: 'item_iron_knife', weight_bps: 1000 };
    const knifeV2 = { id: 'item_iron_knife', weight_bps: 1250 };

    const initialBogSet = buildOneHopDependencySet('char_bog', bog, [
      { entity_id: 'item_iron_knife', payload: knifeV1 }
    ]);

    const activeHashes = new Map([
      ['char_bog', initialBogSet.target_content_hash],
      ['item_iron_knife', computeEntityContentHash(knifeV2)]
    ]);

    const advisory = generateOneHopAdvisoryDiff({
      targetId: 'char_bog',
      previousPinnedSet: initialBogSet,
      currentActiveHashes: activeHashes
    });

    expect(advisory.rebase_required).toBe(true);
    expect(advisory.mutated_foreign_keys.length).toEqual(1);
    expect(advisory.advisory_message).toContain('Review changes and click to rebase');
  });
});
