/**
 * packages/299.lore/02.character.unit/fce/characterScaffold.bit.ts
 * Data transport contracts for the Interactive Character Scaffolding Interview.
 * Pure 7-bit clean ASCII.
 */
export interface CharacterScaffoldInput {
  seriesSlug?: string;
  charId?: string;
  name?: string;
  locomotionBaseline?: string;
  traumaCondition?: string;
  heldItemIds?: string[];
  escalationCeiling?: number;
  stringsHeldOver?: string[];
}

export interface CharacterScaffoldResult {
  success: boolean;
  filePath?: string;
  charId?: string;
  availableArmsBps?: number;
  bannedVerbs?: string[];
  error?: string;
}

export default interface CharacterScaffoldBit {
  idx: string;
  src?: string;
  val?: number;
  dat?: CharacterScaffoldInput;
  slv?: (value: CharacterScaffoldResult) => void;
}
