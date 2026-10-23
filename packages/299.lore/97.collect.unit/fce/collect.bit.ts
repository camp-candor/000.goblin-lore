import {
    ExtractedFactDossierBit,
    DossierExtractionFailureBit,
} from '../../41.canon.unit/fce/byteZero.bit.js'

export default interface CollectBit {
    idx?: string
    src?: string
    val?: number
    dex?: number
    dat?: any
    bit?: any
    slv?: Function
}

export interface FactCollectionBit {
    readonly totalFilesScanned: number
    readonly successfulExtractions: number
    readonly failedExtractions: number
    readonly dossiers: ReadonlyMap<string, ExtractedFactDossierBit>
    readonly failures: readonly DossierExtractionFailureBit[]
}

export interface CollectBatchSuccessBit {
    readonly valid: true
    readonly collection: FactCollectionBit
}

export interface CollectBatchFailureBit {
    readonly valid: false
    readonly errorCode: 'COLLECTION_VALIDATION_BREACH'
    readonly failureCount: number
    readonly errors: readonly string[]
}

export type CollectBatchResultBit =
    CollectBatchSuccessBit | CollectBatchFailureBit
