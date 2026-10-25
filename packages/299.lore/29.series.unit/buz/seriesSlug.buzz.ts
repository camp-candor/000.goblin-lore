import {
    SeriesSlugSchema,
    sanitizeSeriesSlug,
    SERIES_SLUG_MIN_LENGTH,
    SERIES_SLUG_MAX_LENGTH,
} from '../val/seriesSlug.val.js'
import type {
    SeriesSlugValidationResultBit,
    SeriesSlugValidationFailureBit,
} from '../fce/seriesSlug.bit.js'

/**
 * Validates a series slug against the strict POSIX schema, returning a typed result envelope.
 */
export const validateSeriesSlug = (
    rawInput: string,
): SeriesSlugValidationResultBit => {
    const sanitized = sanitizeSeriesSlug(rawInput)

    if (sanitized.length === 0) {
        return {
            valid: false,
            rawInput,
            sanitizedAttempt: sanitized,
            errorCode: 'SLUG_EMPTY',
            message: 'Slug candidate is empty after sanitization.',
        }
    }

    if (sanitized.length < SERIES_SLUG_MIN_LENGTH) {
        return {
            valid: false,
            rawInput,
            sanitizedAttempt: sanitized,
            errorCode: 'SLUG_TOO_SHORT',
            message: `Slug '${sanitized}' is shorter than minimum length of ${SERIES_SLUG_MIN_LENGTH}.`,
        }
    }

    if (sanitized.length > SERIES_SLUG_MAX_LENGTH) {
        return {
            valid: false,
            rawInput,
            sanitizedAttempt: sanitized,
            errorCode: 'SLUG_TOO_LONG',
            message: `Slug '${sanitized}' exceeds maximum length of ${SERIES_SLUG_MAX_LENGTH}.`,
        }
    }

    const parseResult = SeriesSlugSchema.safeParse(sanitized)

    if (!parseResult.success) {
        return {
            valid: false,
            rawInput,
            sanitizedAttempt: sanitized,
            errorCode: 'SLUG_INVALID_FORMAT',
            message:
                parseResult.error.issues[0]?.message ||
                'Invalid POSIX slug format.',
        }
    }

    return {
        valid: true,
        slug: parseResult.data,
    }
}

/**
 * Asserts that a raw title can be sanitized into a valid slug, throwing a fatal Stage T0 error if invalid.
 */
export const assertSeriesSlug = (rawInput: string): string => {
    const result = validateSeriesSlug(rawInput)
    if (!result.valid) {
        const failure = result as SeriesSlugValidationFailureBit
        throw new Error(
            `[SERIES_SLUG_BREACH] ${failure.errorCode}: ${failure.message}`,
        )
    }
    return result.slug
}
