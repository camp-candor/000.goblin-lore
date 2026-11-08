import type Locomotion from './fce/locomotion.interface.js'
import type LocomotionBit from './fce/locomotion.bit.js'

export class LocomotionModel implements Locomotion {
    idx: string = '19.locomotion'
    locomotionBitList: LocomotionBit[] = []
    locomotionBits: Record<string, LocomotionBit> = {}
}
