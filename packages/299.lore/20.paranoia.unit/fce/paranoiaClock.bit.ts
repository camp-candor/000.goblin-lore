import type {
    ParanoiaMeterState,
    AcousticTransientEvent,
    PitchFlutterResult,
} from '../val/paranoiaClock.val.js'

export interface AcousticImpulseReceiptBit {
    readonly clockId: string
    readonly entityId: string
    readonly previousBps: number
    readonly nextBps: number
    readonly baselineBps: number
    readonly arrivalIntensityCdB: number
    readonly effectiveSnrCdB: number
    readonly isAudible: boolean
    readonly impulseAppliedBps: number
    readonly isTriggered: boolean
    readonly updatedEpoch: number
}

export interface ParanoiaClockBitPayload {
    readonly clock?: ParanoiaMeterState
    readonly acousticEvent?: AcousticTransientEvent
    readonly receipt?: AcousticImpulseReceiptBit
    readonly flutter?: PitchFlutterResult
}

export default interface ParanoiaClockBit {
    idx: string
    src?: string
    val?: number
    dat?:
        ParanoiaClockBitPayload | AcousticImpulseReceiptBit | PitchFlutterResult
    slv?: (result: { parBit: Partial<ParanoiaClockBit> }) => void
}
