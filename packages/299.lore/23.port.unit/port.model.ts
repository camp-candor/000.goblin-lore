import type Port from './fce/port.interface.js'
import type PortBit from './fce/port.bit.js'

export class PortModel implements Port {
    idx: string = '23.port'
    portBitList: PortBit[] = []
    portBits: Record<string, PortBit> = {}
}
