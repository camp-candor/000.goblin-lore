import Intensity from './fce/intensity.interface.js';
import type { ComposedSomaticDspMatrix } from './val/algebraicDsp.val.js';

export class IntensityModel implements Intensity {
  idx: string = '14.intensity';
  composedMatrices: Record<string, ComposedSomaticDspMatrix> = {};
}

export default IntensityModel;
