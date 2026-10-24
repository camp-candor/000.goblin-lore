export interface SeriesSlugValidationSuccessBit {
    readonly valid: true
    readonly slug: string
}

export interface SeriesSlugValidationFailureBit {
    readonly valid: false
    readonly rawInput: string
    readonly sanitizedAttempt: string
    readonly errorCode:
        | 'SLUG_TOO_SHORT'
        | 'SLUG_TOO_LONG'
        | 'SLUG_INVALID_FORMAT'
        | 'SLUG_EMPTY'
    readonly message: string
}

export type SeriesSlugValidationResultBit =
    SeriesSlugValidationSuccessBit | SeriesSlugValidationFailureBit
