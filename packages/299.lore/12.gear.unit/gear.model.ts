import type Gear from './fce/gear.interface.js'
import type GearBit from './fce/gear.bit.js'

export class GearModel implements Gear {
    idx: string = '12.gear'
    gearBitList: GearBit[] = []
    gearBits: Record<string, GearBit> = {}
}
