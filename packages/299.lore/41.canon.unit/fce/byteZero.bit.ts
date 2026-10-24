import { ByteZeroErrorCode } from '../val/byteZero.val.js'

export interface ByteZeroCheckResult {
    readonly valid: boolean
    readonly isValid?: boolean
    readonly firstFourBytesHex?: string
    readonly byteOffset: number
    readonly hasBom: boolean
    readonly hasCarriageReturns: boolean
    readonly errorCode?: ByteZeroErrorCode
    readonly message?: string
}

export interface ExtractedFactDossierBit<T = unknown> {
    readonly valid: true
    readonly filePath: string
    readonly frontmatter: Readonly<T>
    readonly proseBody: string
    readonly rawFrontmatterYaml: string
    readonly byteSize: number
}

export interface DossierExtractionFailureBit {
    readonly valid: false
    readonly filePath: string
    readonly errorCode: ByteZeroErrorCode
    readonly message: string
}

export type DossierExtractionResult<T = unknown> =
    ExtractedFactDossierBit<T> | DossierExtractionFailureBit
