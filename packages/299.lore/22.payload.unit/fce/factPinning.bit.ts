import type {
  StalenessEvaluationInput,
  StalenessEvaluationReceipt,
  PinnedFactEntry,
} from '../val/factPinning.val.js';

export interface FactPinningBitPayload {
  readonly input?: StalenessEvaluationInput;
  readonly receipt?: StalenessEvaluationReceipt;
  readonly pinnedEntries?: readonly PinnedFactEntry[];
  readonly errorCode?: string;
  readonly reason?: string;
}

export default interface FactPinningBit {
  idx: string;
  src?: string;
  val?: number;
  dat?: FactPinningBitPayload | StalenessEvaluationInput | StalenessEvaluationReceipt;
  slv?: (result: { pinBit: Partial<FactPinningBit> }) => void;
}
