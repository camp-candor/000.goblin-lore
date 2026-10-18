import crypto from 'node:crypto';
import {
  OneHopDependencySetSchema,
  OneHopAdvisoryDiffSchema,
} from '../../schemas/dependencyHash.schema.js';

export function canonicalJsonStringify(obj: any): string {
  if (obj === null) return "null";
  if (Array.isArray(obj)) {
    return "[" + obj.map(canonicalJsonStringify).join(",") + "]";
  }
  if (typeof obj === "object") {
    const keys = Object.keys(obj).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalJsonStringify(obj[k])).join(",") + "}";
  }
  return JSON.stringify(obj);
}

export function computeSha256(data: string | Buffer): string {
  return crypto.createHash("sha256").update(data).digest("hex");
}

export function computeEntityContentHash(payload: any): string {
  if (payload === null || payload === "" || (Buffer.isBuffer(payload) && payload.length === 0)) {
    throw new Error("CORRUPTED_ZERO_BYTE_ASSET");
  }
  return computeSha256(canonicalJsonStringify(payload));
}

export function computeDirectOneHopHdep(targetHash: string, fkHashes: string[]): string {
  const sortedHashes = [targetHash, ...fkHashes].sort();
  return computeSha256(canonicalJsonStringify(sortedHashes));
}

export function buildOneHopDependencySet(
  targetId: string,
  targetPayload: any,
  foreignKeys: { entity_id: string; payload: any }[]
): any {
  const targetHash = computeEntityContentHash(targetPayload);
  const fkHashes = foreignKeys.map(fk => ({
    entity_id: fk.entity_id,
    content_hash: computeEntityContentHash(fk.payload),
    updated_at_epoch: 0
  }));

  const hdep = computeDirectOneHopHdep(targetHash, fkHashes.map(fk => fk.content_hash));

  return OneHopDependencySetSchema.parse({
    target_id: targetId,
    target_content_hash: targetHash,
    foreign_keys: fkHashes,
    computed_h_dep: hdep,
    pinned_at_epoch: 0
  });
}

export function generateOneHopAdvisoryDiff(params: {
  targetId: string;
  previousPinnedSet: any;
  currentActiveHashes: Map<string, string>;
}): any {
  const { targetId, previousPinnedSet, currentActiveHashes } = params;
  let rebaseRequired = false;
  const mutatedForeignKeys: string[] = [];

  const newTargetHash = currentActiveHashes.get(targetId) || previousPinnedSet.target_content_hash;

  const currentFkHashes = previousPinnedSet.foreign_keys.map((fk: any) => {
    const activeHash = currentActiveHashes.get(fk.entity_id);
    if (activeHash && activeHash !== fk.content_hash) {
      rebaseRequired = true;
      mutatedForeignKeys.push(fk.entity_id);
      return activeHash;
    }
    return fk.content_hash;
  });

  const currentHdep = computeDirectOneHopHdep(newTargetHash, currentFkHashes);

  return OneHopAdvisoryDiffSchema.parse({
    target_id: targetId,
    rebase_required: rebaseRequired,
    current_h_dep: currentHdep,
    mutated_foreign_keys: mutatedForeignKeys,
    advisory_message: rebaseRequired ? "Review changes and click to rebase" : "No changes"
  });
}
