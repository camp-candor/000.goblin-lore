import Decay from './fce/decay.interface.js';
import type { PressureMeter } from './val/pressureMeter.val.js';
import type { ThermodynamicCycleReceiptBit } from './fce/pressureMeter.bit.js';

export class DecayModel implements Decay {
  idx: string = '08.decay';
  meters: Record<string, PressureMeter> = {};
  cycleReceipts: Record<string, ThermodynamicCycleReceiptBit> = {};
}
