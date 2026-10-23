import type LocomotionBit from './locomotion.bit.js'
import type { LocomotionProfile } from '../val/locomotion.val.js'

export default interface Locomotion {
    idx?: string
    locomotionBitList?: LocomotionBit[]
    locomotionBits?: Record<string, LocomotionProfile>
}
