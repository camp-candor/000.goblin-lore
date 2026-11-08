import type CatalystBit from './catalyst.bit.js'

export default interface Catalyst {
    idx: string
    catalystBitList: CatalystBit[]
    catalystBits: Record<string, CatalystBit>
}
