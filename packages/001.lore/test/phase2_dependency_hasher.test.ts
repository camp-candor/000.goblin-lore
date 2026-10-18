import { describe, it, expect } from 'vitest';
import {
  canonicalJsonStringify,
  computeEntityContentHash,
  computeDirectOneHopHdep,
  buildOneHopDependencySet,
  generateOneHopAdvisoryDiff
} from '../src/core/versioning/dependencyHasher.js';
import { LocalOneHopLedger } from '../src/db/localOneHopLedger.js';

describe('Phase 2 Dependency Hasher', () => {

  describe('RFC 8785 Normalization & Zero-Byte Sentinels', () => {
    it('preserves array causal ordering', () => {
      const arrA = { steps: ['first', 'second'] };
      const arrB = { steps: ['second', 'first'] };
      expect(canonicalJsonStringify(arrA)).not.toBe(canonicalJsonStringify(arrB));
    });

    it('sorts keys by UTF-16 code units', () => {
      const objA = { z: 100, b: 2, a: { y: 'bar', x: 'foo' } };
      const objB = { a: { x: 'foo', y: 'bar' }, z: 100, b: 2 };
      expect(canonicalJsonStringify(objA)).toBe(canonicalJsonStringify(objB));
      expect(computeEntityContentHash(objA)).toBe(computeEntityContentHash(objB));
    });

    it('throws CORRUPTED_ZERO_BYTE_ASSET for empty strings', () => {
      expect(() => computeEntityContentHash('')).toThrow('CORRUPTED_ZERO_BYTE_ASSET');
      expect(() => canonicalJsonStringify('')).toThrow('CORRUPTED_ZERO_BYTE_ASSET');
    });

    it('throws CORRUPTED_ZERO_BYTE_ASSET for 0-byte buffers', () => {
      expect(() => computeEntityContentHash(Buffer.alloc(0))).toThrow('CORRUPTED_ZERO_BYTE_ASSET');
      expect(() => canonicalJsonStringify(Buffer.alloc(0))).toThrow('CORRUPTED_ZERO_BYTE_ASSET');
    });
  });

  describe('1-Hop Deterministic Set Hashing', () => {
    it('sorts foreign-key hash sets prior to hashing', () => {
      const target = 'a'.repeat(64);
      const fk1 = '1'.repeat(64);
      const fk2 = '2'.repeat(64);
      const fk3 = '3'.repeat(64);

      const hash1 = computeDirectOneHopHdep(target, [fk1, fk2, fk3]);
      const hash2 = computeDirectOneHopHdep(target, [fk3, fk1, fk2]);
      const hash3 = computeDirectOneHopHdep(target, [fk2, fk3, fk1]);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });
  });

  describe('Hub Invalidation Trap Shield', () => {
    it('does NOT invalidate the target entity when an unrelated prop changes', () => {
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
      expect(advisory.current_h_dep).toBe(initialBogSet.computed_h_dep);
      expect(advisory.advisory_message).toContain('Hub Invalidation Trap Shield held');
    });
  });

  describe('Local SQLite Ledger Persistence', () => {
    it('persists 1-hop dependency sets to local SQLite', () => {
      const ledger = new LocalOneHopLedger(':memory:');
      const depSet = buildOneHopDependencySet('char_bog', { name: 'Bog' }, [
        { entity_id: 'item_knife', payload: { name: 'Knife' } }
      ]);

      ledger.storeOneHopDependencySet(depSet);

      const storedHdep = ledger.getStoredHdep('char_bog');
      const storedContentHash = ledger.getEntityContentHash('char_bog');

      expect(storedHdep).toBe(depSet.computed_h_dep);
      expect(storedContentHash).toBe(depSet.target_content_hash);

      ledger.close();
    });
  });

  describe('Graceful Rebase Contract', () => {
    it('detects direct foreign key mutations and generates a structured advisory', () => {
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
      expect(advisory.mutated_foreign_keys).toEqual(['item_iron_knife']);
      expect(advisory.advisory_message).toContain('Review changes and click to rebase');
    });
  });
});
