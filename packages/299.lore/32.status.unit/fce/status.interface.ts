import type StatusBit from './status.bit.js'

export default interface Status {
    idx: string
    statusBitList: StatusBit[]
    statusBits: Record<string, StatusBit>
}
