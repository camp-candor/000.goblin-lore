import { describe, it, expect } from 'vitest'
import {
    sanitizeSeriesSlug,
    SeriesSlugSchema,
    SERIES_SLUG_MIN_LENGTH,
    SERIES_SLUG_MAX_LENGTH,
} from '../val/seriesSlug.val.js'
import { validateSeriesSlug, assertSeriesSlug } from '../buz/seriesSlug.buzz.js'
import type { SeriesSlugValidationFailureBit } from '../fce/seriesSlug.bit.js'

describe('29.series.unit - Posix Slug Sanitization Validator', () => {
    describe('sanitizeSeriesSlug', () => {
        it('normalizes uppercase, whitespace, and underscores into clean kebab-case', () => {
            expect(sanitizeSeriesSlug('Wiregrass Basin')).toBe(
                'wiregrass-basin',
            )
            expect(sanitizeSeriesSlug('  Wiregrass__Basin_Project  ')).toBe(
                'wiregrass-basin-project',
            )
            expect(sanitizeSeriesSlug('THE_GREAT_SWAMP')).toBe(
                'the-great-swamp',
            )
        })

        it('strips non-ASCII characters, symbols, and punctuation', () => {
            expect(sanitizeSeriesSlug('Wiregrass #01: Basin!!')).toBe(
                'wiregrass-01-basin',
            )
            expect(sanitizeSeriesSlug('Under the @Floorboards$')).toBe(
                'under-the-floorboards',
            )
        })

        it('strips ANSI terminal escape sequences cleanly', () => {
            expect(
                sanitizeSeriesSlug(
                    '\x1b[31mWiregrass\x1b[0m \x1b[32mBasin\x1b[0m',
                ),
            ).toBe('wiregrass-basin')
        })

        it('collapses multiple consecutive hyphens and trims leading/trailing hyphens', () => {
            expect(sanitizeSeriesSlug('---wiregrass----basin---')).toBe(
                'wiregrass-basin',
            )
            expect(sanitizeSeriesSlug(' - - wiregrass - basin - - ')).toBe(
                'wiregrass-basin',
            )
        })

        it('returns empty string for invalid inputs', () => {
            expect(sanitizeSeriesSlug('')).toBe('')
            expect(sanitizeSeriesSlug('   ')).toBe('')
            expect(sanitizeSeriesSlug('!@#$%^&*()')).toBe('')
            expect(sanitizeSeriesSlug(null as any)).toBe('')
        })
    })

    describe('SeriesSlugSchema', () => {
        it('validates canonical POSIX slugs', () => {
            expect(SeriesSlugSchema.parse('wiregrass-basin')).toBe(
                'wiregrass-basin',
            )
            expect(SeriesSlugSchema.parse('ep01-scene02')).toBe('ep01-scene02')
            expect(SeriesSlugSchema.parse('goblin-lore-core')).toBe(
                'goblin-lore-core',
            )
        })

        it('rejects slugs shorter than minimum length', () => {
            expect(() => SeriesSlugSchema.parse('ab')).toThrow()
        })

        it('rejects slugs longer than maximum length', () => {
            const longSlug = 'a'.repeat(SERIES_SLUG_MAX_LENGTH + 1)
            expect(() => SeriesSlugSchema.parse(longSlug)).toThrow()
        })

        it('rejects uppercase characters, spaces, and consecutive hyphens', () => {
            expect(() => SeriesSlugSchema.parse('Wiregrass')).toThrow()
            expect(() => SeriesSlugSchema.parse('wiregrass basin')).toThrow()
            expect(() => SeriesSlugSchema.parse('wiregrass--basin')).toThrow()
            expect(() => SeriesSlugSchema.parse('-wiregrass')).toThrow()
            expect(() => SeriesSlugSchema.parse('wiregrass-')).toThrow()
        })
    })

    describe('validateSeriesSlug & assertSeriesSlug', () => {
        it('validates valid candidate strings cleanly', () => {
            const res = validateSeriesSlug('  Wiregrass Basin  ')
            expect(res.valid).toBe(true)
            if (res.valid) {
                expect(res.slug).toBe('wiregrass-basin')
            }
            expect(assertSeriesSlug('  Wiregrass Basin  ')).toBe(
                'wiregrass-basin',
            )
        })

        it('returns SLUG_EMPTY when input cannot produce valid characters', () => {
            const res = validateSeriesSlug('   !@#$   ')
            expect(res.valid).toBe(false)
            if (!res.valid) {
                const failure = res as SeriesSlugValidationFailureBit
                expect(failure.errorCode).toBe('SLUG_EMPTY')
            }
            expect(() => assertSeriesSlug('!@#$')).toThrow(/SLUG_EMPTY/)
        })

        it('returns SLUG_TOO_SHORT when sanitized slug length < 3', () => {
            const res = validateSeriesSlug('wb')
            expect(res.valid).toBe(false)
            if (!res.valid) {
                const failure = res as SeriesSlugValidationFailureBit
                expect(failure.errorCode).toBe('SLUG_TOO_SHORT')
            }
            expect(() => assertSeriesSlug('wb')).toThrow(/SLUG_TOO_SHORT/)
        })

        it('returns SLUG_TOO_LONG when sanitized slug length > 64', () => {
            const longTitle = 'word-'.repeat(20)
            const res = validateSeriesSlug(longTitle)
            expect(res.valid).toBe(false)
            if (!res.valid) {
                const failure = res as SeriesSlugValidationFailureBit
                expect(failure.errorCode).toBe('SLUG_TOO_LONG')
            }
            expect(() => assertSeriesSlug(longTitle)).toThrow(/SLUG_TOO_LONG/)
        })
    })
})
