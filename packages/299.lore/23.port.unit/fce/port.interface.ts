import type PortBit from './port.bit.js'

export default interface Port {
    idx: string
    portBitList: PortBit[]
    portBits: Record<string, PortBit>
}
