export interface LocomotionValidationBit {
    readonly baseline: string
    readonly payload?: Record<string, unknown>
}
export default interface LocomotionBit {
    idx: string
    src?: string
    val?: number
    dat?: Record<string, any>
    slv?: (res: any) => void
}
