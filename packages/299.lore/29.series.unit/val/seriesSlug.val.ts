import { z } from 'zod'

export const SERIES_SLUG_MIN_LENGTH = 3
export const SERIES_SLUG_MAX_LENGTH = 64
export const SERIES_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Zod schema strictly validating canonical POSIX series slugs.
 */
export const SeriesSlugSchema = z
    .string()
    .min(SERIES_SLUG_MIN_LENGTH, {
        message: `Series slug must be at least ${SERIES_SLUG_MIN_LENGTH} characters long.`,
    })
    .max(SERIES_SLUG_MAX_LENGTH, {
        message: `Series slug must not exceed ${SERIES_SLUG_MAX_LENGTH} characters.`,
    })
    .regex(SERIES_SLUG_REGEX, {
        message:
            'Series slug must be lowercase alphanumeric words separated by single hyphens.',
    })

export type SeriesSlug = z.infer<typeof SeriesSlugSchema>

/**
 * Normalizes an arbitrary raw title string into a strict POSIX-compliant kebab-case slug.
 */
export const sanitizeSeriesSlug = (rawInput: string): string => {
    if (!rawInput || typeof rawInput !== 'string') {
        return ''
    }

    return (
        rawInput
            // 1. Strip ANSI escape codes
            .replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')
            // 2. Downcase to ASCII lowercase
            .toLowerCase()
            .trim()
            // 3. Replace underscores, slashes, and whitespace with hyphens
            .replace(/[\s_/\\:]+/g, '-')
            // 4. Strip any character outside [a-z0-9-]
            .replace(/[^a-z0-9-]/g, '')
            // 5. Collapse consecutive hyphens into a single hyphen
            .replace(/-+/g, '-')
            // 6. Trim leading and trailing hyphens
            .replace(/^-+|-+$/g, '')
    )
}
