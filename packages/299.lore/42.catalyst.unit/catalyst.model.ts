import type Catalyst from './fce/catalyst.interface.js'
import type CatalystBit from './fce/catalyst.bit.js'

export class CatalystModel implements Catalyst {
    idx: string = '42.catalyst'
    catalystBitList: CatalystBit[] = []
    catalystBits: Record<string, CatalystBit> = {}
}
