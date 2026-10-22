import { z } from 'zod'

/**
 * 7-bit ASCII Byte Code Constants:
 * - ASCII_LF: 0x0A (Line feed)
 * - ASCII_PRINTABLE_MIN: 0x20 (Space)
 * - ASCII_PRINTABLE_MAX: 0x7E (Tilde)
 * - UTF8_BOM_CHAR_CODE: 0xFEFF (Byte Order Mark)
 */
export const ASCII_LF = 0x0a
export const ASCII_PRINTABLE_MIN = 0x20
export const ASCII_PRINTABLE_MAX = 0x7e
export const UTF8_BOM_CHAR_CODE = 0xfeff

export const CLAIM_TEXT_MIN_LENGTH = 5
export const CLAIM_TEXT_MAX_LENGTH = 500

// Single ESC control character (0x1B), built at runtime so this source file
// stays strictly printable ASCII with no raw control bytes.
const ESC_CHAR = String.fromCharCode(0x1b)

/**
 * Regular Expression Contracts:
 * - ANSI_ESCAPE_REGEX: Matches ANSI escape sequences (ESC byte 0x1B + CSI introducer).
 * - ASCII_STRICT_REGEX: Matches only printable ASCII characters and line feed.
 */
export const ANSI_ESCAPE_REGEX = new RegExp(
    ESC_CHAR + '\\[[0-9;?]*[a-zA-Z]',
    'g',
)
export const ASCII_STRICT_REGEX = /^[\x20-\x7E\n]+$/

/**
 * Zod Schema enforcing strict 7-bit printable ASCII claim texts.
 */
export const ClaimTextAsciiSchema = z
    .string({
        required_error: 'Claim text is required',
        invalid_type_error: 'Claim text must be a string',
    })
    .min(
        CLAIM_TEXT_MIN_LENGTH,
        `Claim text must be at least ${CLAIM_TEXT_MIN_LENGTH} characters`,
    )
    .max(
        CLAIM_TEXT_MAX_LENGTH,
        `Claim text must not exceed ${CLAIM_TEXT_MAX_LENGTH} characters`,
    )
    .refine((val) => !val.includes('\r'), {
        message:
            'Carriage return (\\r) is strictly forbidden. Use canonical LF (\\n).',
    })
    .refine((val) => val.charCodeAt(0) !== UTF8_BOM_CHAR_CODE, {
        message:
            'UTF-8 BOM (0xFEFF) detected at index 0. Byte-0 frontmatter law violated.',
    })
    .refine(
        (val) => {
            ANSI_ESCAPE_REGEX.lastIndex = 0
            return !ANSI_ESCAPE_REGEX.test(val)
        },
        {
            message:
                'ANSI terminal control escape sequences are strictly prohibited.',
        },
    )
    .refine((val) => ASCII_STRICT_REGEX.test(val), {
        message:
            'Claim text contains non-ASCII or non-printable characters outside 0x20-0x7E.',
    })

export type ClaimTextAscii = z.infer<typeof ClaimTextAsciiSchema>
