import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import yaml from 'js-yaml';
import {
  WorldConditionsFrontmatterSchema,
  assertIntegerMetric,
  type ConditionRegistryEntry,
} from '../val/conditionsRegistry.val.js';
import type {
  ExtractedSomaticLedgerRecordBit,
  SomaticDspDeltaSummaryBit,
} from '../fce/somaticLedger.bit.js';

export function parseByteZeroDossier(filePath: string): { frontmatter: Record<string, unknown>; contentSha256: string } {
  if (!fs.existsSync(filePath)) {
    throw new Error(`[DOSSIER_NOT_FOUND] Cannot locate dossier at: ${filePath}`);
  }
  const buffer = fs.readFileSync(filePath);
  const content = buffer.toString('utf8');

  if (!content.startsWith('---')) {
    throw new Error(`[BYTE_ZERO_BREACH] File must begin with YAML frontmatter delimiter '---' at byte 0: ${filePath}`);
  }

  const parts = content.split('---');
  if (parts.length < 3) {
    throw new Error(`[INVALID_FRONTMATTER] Malformed YAML frontmatter delimiters in: ${filePath}`);
  }

  const parsedYaml = yaml.load(parts[1]) as Record<string, unknown>;
  const contentSha256 = crypto.createHash('sha256').update(buffer).digest('hex');

  return { frontmatter: parsedYaml, contentSha256 };
}

export function loadConditionsCatalogFromDisk(conditionsFilePath: string): Map<string, ConditionRegistryEntry> {
  const { frontmatter } = parseByteZeroDossier(conditionsFilePath);
  const validated = WorldConditionsFrontmatterSchema.parse(frontmatter);
  const catalog = new Map<string, ConditionRegistryEntry>();
  for (const cond of validated.conditions) {
    catalog.set(cond.condition_slug, cond);
  }
  return catalog;
}

export function extractCharacterSomaticRecord(
  characterFilePath: string,
  conditionsCatalog: Map<string, ConditionRegistryEntry>,
): ExtractedSomaticLedgerRecordBit {
  const { frontmatter, contentSha256 } = parseByteZeroDossier(characterFilePath);
  const machineRail = (frontmatter.machineRail || frontmatter) as Record<string, any>;
  const entityId = String(machineRail.id || path.basename(characterFilePath, '.md'));
  const somatic = machineRail.somatic || {};

  const locomotionBaseline = String(somatic.locomotion_baseline || 'bipedal_standard');
  const declaredConditions = Array.isArray(somatic.conditions) ? somatic.conditions.map(String) : [];
  const manualBannedVerbs = Array.isArray(somatic.banned_kinetic_verbs) ? somatic.banned_kinetic_verbs.map(String) : [];

  let totalArmPenaltyBps = 0;
  let totalVelocityPenaltyBps = 0;
  let chronicFatigueFloorBps = 0;
  let chronicPainFloorBps = 0;
  let chronicRefusalStrainFloorBps = 0;
  let chronicParanoiaFloorBps = 0;
  let auditoryDebuffCdB = 0;

  let pitchShiftCentitones = 0;
  let formantWarpingBps = 10000;
  let vocalFryDensityBps = 0;
  let breathinessPauseBps = 10000;
  const bannedCadencesSet = new Set<string>();
  const aggregatedBannedVerbs = new Set<string>(manualBannedVerbs);

  for (const slug of declaredConditions) {
    const entry = conditionsCatalog.get(slug);
    if (!entry) continue;

    totalArmPenaltyBps += entry.arm_penalty_bps;
    totalVelocityPenaltyBps += entry.velocity_penalty_bps;
    chronicFatigueFloorBps += entry.chronic_fatigue_floor_bps;
    chronicPainFloorBps += entry.chronic_pain_floor_bps;
    chronicRefusalStrainFloorBps += entry.chronic_refusal_strain_floor_bps;
    chronicParanoiaFloorBps += entry.chronic_paranoia_floor_bps;
    auditoryDebuffCdB += entry.auditory_debuff_cdb;

    pitchShiftCentitones += entry.dsp_deltas.pitch_shift_centitones;
    formantWarpingBps = Math.min(formantWarpingBps, entry.dsp_deltas.formant_warping_bps);
    vocalFryDensityBps = Math.max(vocalFryDensityBps, entry.dsp_deltas.vocal_fry_density_bps);
    breathinessPauseBps = Math.max(breathinessPauseBps, entry.dsp_deltas.breathiness_pause_bps);

    for (const v of entry.banned_verbs) aggregatedBannedVerbs.add(v);
    for (const c of entry.dsp_deltas.banned_cadences) bannedCadencesSet.add(c);
  }

  const availableArmsBps = Math.max(0, 20000 - totalArmPenaltyBps);
  const armsAvailable = availableArmsBps >= 20000 ? 2 : availableArmsBps >= 10000 ? 1 : 0;
  const legsAvailable = locomotionBaseline === 'limping' ? 1 : 2;

  let locomotionTier: 'UNRESTRICTED' | 'LIMPING' | 'IMMOBILIZED' = 'UNRESTRICTED';
  if (legsAvailable < 1 || chronicPainFloorBps >= 9000) {
    locomotionTier = 'IMMOBILIZED';
  } else if (legsAvailable === 1 || chronicPainFloorBps >= 5000 || totalVelocityPenaltyBps > 3000) {
    locomotionTier = 'LIMPING';
  }

  assertIntegerMetric(availableArmsBps, 'availableArmsBps');
  assertIntegerMetric(chronicFatigueFloorBps, 'chronicFatigueFloorBps');
  assertIntegerMetric(chronicPainFloorBps, 'chronicPainFloorBps');
  assertIntegerMetric(chronicRefusalStrainFloorBps, 'chronicRefusalStrainFloorBps');
  assertIntegerMetric(chronicParanoiaFloorBps, 'chronicParanoiaFloorBps');

  const baselineDspDeltas: SomaticDspDeltaSummaryBit = Object.freeze({
    pitchShiftCentitones: Math.max(-1200, Math.min(1200, pitchShiftCentitones)),
    formantWarpingBps: Math.max(5000, Math.min(20000, formantWarpingBps)),
    vocalFryDensityBps: Math.min(10000, vocalFryDensityBps),
    breathinessPauseBps: Math.min(35000, breathinessPauseBps),
    bannedCadences: Object.freeze(Array.from(bannedCadencesSet).sort()),
  });

  const record: ExtractedSomaticLedgerRecordBit = {
    entityId,
    locomotionBaseline,
    availableArmsBps,
    armsAvailable,
    legsAvailable,
    locomotionTier,
    chronicFatigueFloorBps: Math.min(10000, chronicFatigueFloorBps),
    chronicPainFloorBps: Math.min(10000, chronicPainFloorBps),
    chronicRefusalStrainFloorBps: Math.min(10000, chronicRefusalStrainFloorBps),
    chronicParanoiaFloorBps: Math.min(10000, chronicParanoiaFloorBps),
    activeConditions: Object.freeze([...declaredConditions]),
    bannedVerbs: Object.freeze(Array.from(aggregatedBannedVerbs).sort()),
    auditoryDebuffCdB: Math.min(10000, auditoryDebuffCdB),
    baselineDspDeltas,
    sourceDossierPath: filePathNormalize(characterFilePath),
    contentSha256,
  };

  return Object.freeze(record);
}

function filePathNormalize(p: string): string {
  return p.replace(/\\/g, '/');
}
