import type {
    LocomotionBaseline,
    LocomotionProfile,
} from '../val/locomotion.val.js'

export default interface LocomotionBit {
    idx: string
    src?: string
    val?: number
    dat?: {
        baseline?: LocomotionBaseline | string
        profile?: LocomotionProfile
        isValid?: boolean
        error?: string
    }
    slv?: (result: any) => void
}
