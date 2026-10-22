import { z } from 'zod'

/**
 * Byte-level invariants for 7-bit ASCII sanitization.
 */
export const ASCII_LF = 0x0a
export const ASCII_PRINTABLE_MIN = 0x20
export const ASCII_PRINTABLE_MAX = 0x7e
export const UTF8_BOM_CHAR_CODE = 0xfeff

export const CLAIM_TEXT_MIN_LENGTH = 5
export const CLAIM_TEXT_MAX_LENGTH = 500

/**
 * ANSI escape sequence regular expression (CSI and common escapes).
 */
export const ANSI_ESCAPE_REGEX = /\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])/g

/**
 * Regex matching strictly permitted 7-bit printable ASCII characters plus LF (\n).
 */
export const ASCII_STRICT_REGEX = /^[\x20-\x7E\x0A]+$/

/**
 * Zod schema enforcing pure 7-bit ASCII claim text boundaries.
 */
export const ClaimTextAsciiSchema = z
    .string({
        required_error: 'Claim text is required',
        invalid_type_error: 'Claim text must be a string primitive',
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
            'Carriage return (\\r) is strictly prohibited. Use standard LF (\\n).',
    })
    .refine((val) => val.charCodeAt(0) !== UTF8_BOM_CHAR_CODE, {
        message: 'UTF-8 Byte Order Mark (BOM) is prohibited at Byte 0.',
    })
    .refine((val) => !ANSI_ESCAPE_REGEX.test(val), {
        message: 'ANSI terminal escape sequences are strictly prohibited.',
    })
    .refine((val) => ASCII_STRICT_REGEX.test(val), {
        message:
            'Claim text must strictly contain pure 7-bit ASCII characters (0x20-0x7E, 0x0A).',
    })

export type ClaimTextAscii = z.infer<typeof ClaimTextAsciiSchema>
