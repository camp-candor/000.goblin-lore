import type { TTSGenerationRequest } from '../val/ttsPayload.val.js';

export interface TTSPayloadValidationReceiptBit {
  readonly status: 'PASSED' | 'FAILED';
  readonly lineId: string;
  readonly characterId: string;
  readonly canSpeak: boolean;
  readonly pinnedFactCount: number;
  readonly isStrictlyConformant: boolean;
  readonly error?: string;
}

export interface PayloadBitPayload {
  readonly request?: TTSGenerationRequest;
  readonly receipt?: TTSPayloadValidationReceiptBit;
  readonly candidatePayload?: unknown;
}

export default interface PayloadBit {
  idx: string;
  src?: string;
  val?: number;
  dat?: PayloadBitPayload | TTSGenerationRequest | TTSPayloadValidationReceiptBit;
  slv?: (result: { pldBit: Partial<PayloadBit> }) => void;
}
