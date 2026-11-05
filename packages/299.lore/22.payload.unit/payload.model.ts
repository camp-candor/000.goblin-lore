import Payload from './fce/payload.interface.js';
import type { TTSGenerationRequest } from './val/ttsPayload.val.js';
import type { TTSPayloadValidationReceiptBit } from './fce/ttsPayload.bit.js';

export class PayloadModel implements Payload {
  idx: string = '22.payload';
  validatedPayloads: Record<string, TTSGenerationRequest> = {};
  validationReceipts: Record<string, TTSPayloadValidationReceiptBit> = {};
  totalValidatedCount: number = 0;
}

export default PayloadModel;
