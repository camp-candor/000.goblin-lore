import Paranoia from './fce/paranoia.interface.js'
import type {
    ParanoiaMeterState,
    PitchFlutterResult,
} from './val/paranoiaClock.val.js'
import type { AcousticImpulseReceiptBit } from './fce/paranoiaClock.bit.js'

export class ParanoiaModel implements Paranoia {
    idx: string = '20.paranoia'
    clocksByEntity: Record<string, ParanoiaMeterState> = {}
    lastReceipts: Record<string, AcousticImpulseReceiptBit> = {}
    flutterProfiles: Record<string, PitchFlutterResult> = {}
}

export default ParanoiaModel
