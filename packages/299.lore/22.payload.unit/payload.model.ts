import Payload from './fce/payload.interface.js';
import type { TTSGenerationRequest } from './val/ttsPayload.val.js';
import type { TTSPayloadValidationReceiptBit } from './fce/ttsPayload.bit.js';
import type { VocalFeasibilityReceipt } from './val/aphoniaGate.val.js';
import type { StalenessEvaluationReceipt } from './val/factPinning.val.js';

export class PayloadModel implements Payload {
  idx: string = '22.payload';
  validatedPayloads: Record<string, TTSGenerationRequest> = {};
  validationReceipts: Record<string, TTSPayloadValidationReceiptBit> = {};
  feasibilityReceipts: Record<string, VocalFeasibilityReceipt> = {};
  stalenessReceipts: Record<string, StalenessEvaluationReceipt> = {};
  totalValidatedCount: number = 0;
}

export default PayloadModel;
