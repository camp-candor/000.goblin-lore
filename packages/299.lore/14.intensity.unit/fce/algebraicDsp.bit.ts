import type {
  AlgebraicDspCompositionInput,
  ComposedSomaticDspMatrix,
} from '../val/algebraicDsp.val.js';

export interface AlgebraicDspBitPayload {
  readonly input?: AlgebraicDspCompositionInput;
  readonly result?: ComposedSomaticDspMatrix;
  readonly errorCode?: string;
  readonly reason?: string;
}

export default interface IntensityBit {
  idx: string;
  src?: string;
  val?: number;
  dat?: AlgebraicDspBitPayload | ComposedSomaticDspMatrix;
  slv?: (result: { intBit: Partial<IntensityBit> }) => void;
}
