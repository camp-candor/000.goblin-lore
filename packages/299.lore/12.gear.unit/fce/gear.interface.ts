import type GearBit from './gear.bit.js'

export default interface Gear {
    idx: string
    gearBitList: GearBit[]
    gearBits: Record<string, GearBit>
}
