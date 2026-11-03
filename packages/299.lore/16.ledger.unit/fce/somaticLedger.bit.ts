import type ConditionRegistryEntryBit from './conditionsRegistry.bit.js';

export interface SomaticDspDeltaSummaryBit {
  readonly pitchShiftCentitones: number;
  readonly formantWarpingBps: number;
  readonly vocalFryDensityBps: number;
  readonly breathinessPauseBps: number;
  readonly bannedCadences: readonly string[];
}

export interface ExtractedSomaticLedgerRecordBit {
  readonly entityId: string;
  readonly locomotionBaseline: string;
  readonly availableArmsBps: number;
  readonly armsAvailable: number;
  readonly legsAvailable: number;
  readonly locomotionTier: 'UNRESTRICTED' | 'LIMPING' | 'IMMOBILIZED';
  readonly chronicFatigueFloorBps: number;
  readonly chronicPainFloorBps: number;
  readonly chronicRefusalStrainFloorBps: number;
  readonly chronicParanoiaFloorBps: number;
  readonly activeConditions: readonly string[];
  readonly bannedVerbs: readonly string[];
  readonly auditoryDebuffCdB: number;
  readonly baselineDspDeltas: SomaticDspDeltaSummaryBit;
  readonly sourceDossierPath: string;
  readonly contentSha256: string;
}

export default interface SomaticLedgerBit {
  idx: string;
  src?: string;
  val?: number;
  dat?: ExtractedSomaticLedgerRecordBit | ExtractedSomaticLedgerRecordBit[];
  slv?: (result: { ldgBit: Partial<SomaticLedgerBit> }) => void;
}
