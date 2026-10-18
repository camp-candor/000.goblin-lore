import { createHash } from 'node:crypto';
import {
  OneHopDependencySet,
  OneHopAdvisoryDiff,
  EntityContentHash
} from '../../schemas/dependencyHash.schema.js';

// ---------------------------------------------------------------------------
// 1. RFC 8785 Canonical JSON Normalization & Zero-Byte Sentinels
// ---------------------------------------------------------------------------
export function canonicalJsonStringify(obj: any): string {
  if (obj === null) return 'null';
  if (typeof obj !== 'object') {
    if (typeof obj === 'string' && obj === '') {
      throw new Error('CORRUPTED_ZERO_BYTE_ASSET');
    }
    return JSON.stringify(obj);
  }

  // Handle Buffers (Uint8Array in browser contexts, Buffer in Node)
  if (Buffer.isBuffer(obj) || obj instanceof Uint8Array) {
    if (obj.length === 0) {
      throw new Error('CORRUPTED_ZERO_BYTE_ASSET');
    }
    // Simple way to handle binary data in canonical JSON if needed,
    // though usually we hash strings/objects.
    return JSON.stringify(Array.from(obj));
  }

  if (Array.isArray(obj)) {
    return '[' + obj.map(item => canonicalJsonStringify(item)).join(',') + ']';
  }

  const keys = Object.keys(obj).sort();
  let str = '';
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (obj[key] !== undefined) {
      str += (str ? ',' : '') + JSON.stringify(key) + ':' + canonicalJsonStringify(obj[key]);
    }
  }
  return '{' + str + '}';
}

// ---------------------------------------------------------------------------
// 2. SHA-256 Hashing Wrapper
// ---------------------------------------------------------------------------
export function computeSha256(data: string | Buffer): string {
  return createHash('sha256').update(data).digest('hex');
}

// ---------------------------------------------------------------------------
// 3. Entity Content Hasher
// ---------------------------------------------------------------------------
export function computeEntityContentHash(entityPayload: any): string {
  // Explicitly check for empty strings or 0-byte buffers early
  if (typeof entityPayload === 'string' && entityPayload === '') {
    throw new Error('CORRUPTED_ZERO_BYTE_ASSET');
  }
  if (Buffer.isBuffer(entityPayload) && entityPayload.length === 0) {
    throw new Error('CORRUPTED_ZERO_BYTE_ASSET');
  }

  const canonicalStr = canonicalJsonStringify(entityPayload);
  return computeSha256(canonicalStr);
}

// ---------------------------------------------------------------------------
// 4. 1-Hop H_dep Calculator (Deterministic Set Hashing)
// ---------------------------------------------------------------------------
export function computeDirectOneHopHdep(targetContentHash: string, foreignKeyHashes: string[]): string {
  const sortedFkHashes = [...foreignKeyHashes].sort();
  const elements = [targetContentHash, ...sortedFkHashes];
  const combined = elements.join('|');
  return computeSha256(combined);
}

// ---------------------------------------------------------------------------
// 5. Hub Invalidation Trap Shield & One-Hop Set Builder
// ---------------------------------------------------------------------------
export function buildOneHopDependencySet(
  targetId: string,
  targetPayload: any,
  foreignEntities: Array<{ entity_id: string; payload: any }>
): OneHopDependencySet {
  const targetHash = computeEntityContentHash(targetPayload);

  const fkHashes: EntityContentHash[] = foreignEntities.map(fk => ({
    entity_id: fk.entity_id,
    content_hash: computeEntityContentHash(fk.payload),
    // Use an explicit integer for epochs per determinism rules (no Date.now())
    updated_at_epoch: 0
  }));

  const justHashes = fkHashes.map(fk => fk.content_hash);
  const hDep = computeDirectOneHopHdep(targetHash, justHashes);

  return {
    target_id: targetId,
    target_content_hash: targetHash,
    foreign_keys: fkHashes,
    computed_h_dep: hDep,
    pinned_at_epoch: 0
  };
}

// ---------------------------------------------------------------------------
// 6. Graceful Rebase Advisory Diff Generator
// ---------------------------------------------------------------------------
export interface AdvisoryDiffParams {
  targetId: string;
  previousPinnedSet: OneHopDependencySet;
  currentActiveHashes: Map<string, string>; // entity_id -> content_hash
}

export function generateOneHopAdvisoryDiff(params: AdvisoryDiffParams): OneHopAdvisoryDiff {
  const { targetId, previousPinnedSet, currentActiveHashes } = params;

  let rebaseRequired = false;
  const mutatedKeys: string[] = [];
  const currentFkHashes: string[] = [];

  // Check target itself
  const currentTargetHash = currentActiveHashes.get(targetId) || previousPinnedSet.target_content_hash;

  for (const fk of previousPinnedSet.foreign_keys) {
    const currentHash = currentActiveHashes.get(fk.entity_id);
    if (currentHash) {
      currentFkHashes.push(currentHash);
      if (currentHash !== fk.content_hash) {
        rebaseRequired = true;
        mutatedKeys.push(fk.entity_id);
      }
    } else {
      // If missing from active hashes, assume unchanged for the sake of the diff
      currentFkHashes.push(fk.content_hash);
    }
  }

  const currentHdep = computeDirectOneHopHdep(currentTargetHash, currentFkHashes);

  if (currentHdep !== previousPinnedSet.computed_h_dep) {
      rebaseRequired = true;
  }

  const advisoryMsg = rebaseRequired
    ? `Direct dependencies mutated: ${mutatedKeys.join(', ')}. Review changes and click to rebase.`
    : 'No direct dependencies mutated. Hub Invalidation Trap Shield held.';

  return {
    target_id: targetId,
    rebase_required: rebaseRequired,
    mutated_foreign_keys: mutatedKeys,
    previous_h_dep: previousPinnedSet.computed_h_dep,
    current_h_dep: currentHdep,
    advisory_message: advisoryMsg
  };
}
