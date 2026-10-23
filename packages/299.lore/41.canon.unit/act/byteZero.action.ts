import {
    ExtractedFactDossierBit,
    DossierExtractionResult,
} from '../fce/byteZero.bit.js'
import {
    extractByteZeroFactDossier,
    assertByteZeroFactDossier,
} from '../buz/byteZero.buzz.js'

export const ByteZeroActions = {
    EXTRACT_DOSSIER: 'canon/extract-byte-zero-dossier',
    ASSERT_DOSSIER: 'canon/assert-byte-zero-dossier',
} as const

export function extractByteZeroDossierAction<T>(payload: {
    filePath: string
    content: Buffer | Uint8Array | string
    validator?: (data: unknown) => T
}): DossierExtractionResult<T> {
    return extractByteZeroFactDossier(
        payload.filePath,
        payload.content,
        payload.validator,
    )
}

export function assertByteZeroDossierAction<T>(payload: {
    filePath: string
    content: Buffer | Uint8Array | string
    validator?: (data: unknown) => T
}): ExtractedFactDossierBit<T> {
    return assertByteZeroFactDossier(
        payload.filePath,
        payload.content,
        payload.validator,
    )
}
