import type {
  PayloadHashReceipt,
  PayloadParityResult,
  PayloadParityVerificationInput,
} from '../val/payloadHash.val.js';
import type { TTSGenerationRequest } from '../val/ttsPayload.val.js';

export interface PayloadHashBitPayload {
  readonly request?: TTSGenerationRequest;
  readonly receipt?: PayloadHashReceipt;
  readonly parityInput?: PayloadParityVerificationInput;
  readonly parityResult?: PayloadParityResult;
  readonly errorCode?: string;
  readonly reason?: string;
}

export default interface PayloadHashBit {
  idx: string;
  src?: string;
  val?: number;
  dat?: PayloadHashBitPayload | PayloadHashReceipt | PayloadParityResult;
  slv?: (result: { hashBit: Partial<PayloadHashBit> }) => void;
}
