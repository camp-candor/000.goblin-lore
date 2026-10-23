export default interface BusBit {
    idx: string
    val?: number
    lst?: any
    src?: any
    bit?: string
    slv?: Function
    dat?: any
}

export interface BusLogMessageBit {
    readonly channel: string
    readonly message: string
    readonly timestampMs: number
}
