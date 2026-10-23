import type Wound from './fce/wound.interface.js'
import type { LimbClampingReceipt } from './val/wound.val.js'

export class WoundModel implements Wound {
    idx = '40.wound'
    clampedReceipts: Record<string, LimbClampingReceipt> = {}
}
