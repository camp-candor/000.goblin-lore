import type Locomotion from './fce/locomotion.interface.js'
import type LocomotionBit from './fce/locomotion.bit.js'
import type { LocomotionProfile } from './val/locomotion.val.js'

export class LocomotionModel implements Locomotion {
    idx: string = '19.locomotion.unit'
    locomotionBitList: LocomotionBit[] = []
    locomotionBits: Record<string, LocomotionProfile> = {}
}
