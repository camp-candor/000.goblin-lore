import type Bus from './fce/bus.interface.js'
import type BusBit from './fce/bus.bit.js'

export class BusModel implements Bus {
    idx: string = '99.bus'
    busBitList: BusBit[] = []
    busBits: Record<string, BusBit> = {}
    MQTT: any
    actList: any
    client: any
    host: string = 'mqtt://localhost:1883'
    bus: Function
    responseSuffix: string = '-response'
    promises: any = {}
}
