import type LocomotionBit from './locomotion.bit.js'

export default interface Locomotion {
    idx: string
    locomotionBitList: LocomotionBit[]
    locomotionBits: Record<string, LocomotionBit>
}
