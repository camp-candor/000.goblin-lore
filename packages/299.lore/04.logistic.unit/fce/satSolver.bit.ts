export default interface SatSolverBit<TDat = unknown> {
    idx: string
    src?: string
    val?: number
    dat?: TDat
    slv?: (result: { satBit: Partial<SatSolverBit<any>> }) => void
}
