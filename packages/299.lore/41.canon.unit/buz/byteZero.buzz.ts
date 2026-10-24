import * as yaml from 'js-yaml'
import {
    ByteZeroCheckResult,
    DossierExtractionResult,
    ExtractedFactDossierBit,
} from '../fce/byteZero.bit.js'

/**
 * Recursively freezes an object tree to ensure deep runtime immutability.
 */
export function deepFreeze<T>(obj: T): Readonly<T> {
    if (obj === null || typeof obj !== 'object') {
        return obj
    }
    for (const key of Object.getOwnPropertyNames(obj)) {
        const prop = (obj as Record<string, unknown>)[key]
        if (
            prop !== null &&
            (typeof prop === 'object' || typeof prop === 'function')
        ) {
            ;(obj as Record<string, unknown>)[key] = deepFreeze(prop)
        }
    }
    Object.freeze(obj)
    return new Proxy(obj, {
        set(_target, prop) {
            throw new TypeError(
                `Cannot assign to read only property '${String(prop)}'`,
            )
        },
        defineProperty(_target, prop) {
            throw new TypeError(`Cannot define property '${String(prop)}'`)
        },
        deleteProperty(_target, prop) {
            throw new TypeError(`Cannot delete property '${String(prop)}'`)
        },
    }) as Readonly<T>
}

/**
 * Asserts that the buffer adheres strictly to the Byte-0 Frontmatter Law.
 * Opening bytes must be 0x2D 0x2D 0x2D 0x0A (--- followed by POSIX LF).
 * Prohibits UTF-8 BOM, leading whitespace, and non-POSIX carriage returns.
 */
export function verifyByteZeroIntegrity(
    content: Buffer | Uint8Array | string,
): ByteZeroCheckResult {
    const buf = Buffer.isBuffer(content)
        ? content
        : typeof content === 'string'
          ? Buffer.from(content, 'utf8')
          : Buffer.from(content)

    const firstFourBytesHex =
        buf.length >= 4 ? buf.subarray(0, 4).toString('hex') : ''

    if (buf.length < 4) {
        return {
            valid: false,
            isValid: false,
            firstFourBytesHex,
            byteOffset: 0,
            hasBom: false,
            hasCarriageReturns: false,
            errorCode: 'PAYLOAD_TOO_SHORT',
            message:
                'Content length is under 4 bytes; cannot contain valid Byte-0 frontmatter.',
        }
    }

    // Detect UTF-8 BOM (0xEF 0xBB 0xBF)
    const hasBom = buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf
    if (hasBom) {
        return {
            valid: false,
            isValid: false,
            firstFourBytesHex,
            byteOffset: 3,
            hasBom: true,
            hasCarriageReturns: false,
            errorCode: 'UTF8_BOM_DETECTED',
            message: 'Byte-0 violation: UTF-8 BOM detected at byte offset 0.',
        }
    }

    // Detect leading whitespace or newlines
    if (
        buf[0] === 0x20 ||
        buf[0] === 0x09 ||
        buf[0] === 0x0a ||
        buf[0] === 0x0d
    ) {
        return {
            valid: false,
            isValid: false,
            firstFourBytesHex,
            byteOffset: 0,
            hasBom: false,
            hasCarriageReturns: buf[0] === 0x0d,
            errorCode: 'LEADING_WHITESPACE_DETECTED',
            message:
                'Byte-0 violation: Leading whitespace or newline before frontmatter delimiter.',
        }
    }

    // Check exact 0x2D 0x2D 0x2D (---)
    const startsWithDelimiter =
        buf[0] === 0x2d && buf[1] === 0x2d && buf[2] === 0x2d
    if (!startsWithDelimiter) {
        return {
            valid: false,
            isValid: false,
            firstFourBytesHex,
            byteOffset: 0,
            hasBom: false,
            hasCarriageReturns: false,
            errorCode: 'MISSING_BYTE_ZERO_DELIMITER',
            message:
                'Byte-0 violation: File does not start with "---" at byte index 0.',
        }
    }

    // Check byte 3 is POSIX LF (0x0A)
    if (buf[3] !== 0x0a) {
        const isCrLf = buf[3] === 0x0d && buf[4] === 0x0a
        return {
            valid: false,
            isValid: false,
            firstFourBytesHex,
            byteOffset: 3,
            hasBom: false,
            hasCarriageReturns: buf[3] === 0x0d,
            errorCode: isCrLf
                ? 'CARRIAGE_RETURN_NON_POSIX'
                : 'DELIMITER_NOT_FOLLOWED_BY_LF',
            message: isCrLf
                ? 'Byte-0 violation: Carriage return (CRLF) detected after frontmatter delimiter.'
                : 'Byte-0 violation: Opening delimiter not immediately followed by POSIX LF (0x0A).',
        }
    }

    // Scan frontmatter header block for non-POSIX carriage returns (\r / 0x0D).
    // Bound the header block by locating the closing '---' delimiter on its own line.
    let headerEnd = buf.length
    let pos = 4
    while (pos < buf.length) {
        const idx = buf.indexOf('---', pos)
        if (idx === -1) {
            break
        }
        const prevByte = buf[idx - 1]
        const isLineStart = prevByte === 0x0a || prevByte === 0x0d
        if (isLineStart) {
            const afterDash = idx + 3
            if (afterDash === buf.length) {
                headerEnd = afterDash
                break
            } else if (buf[afterDash] === 0x0a) {
                headerEnd = afterDash + 1
                break
            } else if (buf[afterDash] === 0x0d) {
                if (afterDash + 1 < buf.length && buf[afterDash + 1] === 0x0a) {
                    headerEnd = afterDash + 2
                } else {
                    headerEnd = afterDash + 1
                }
                break
            }
        }
        pos = idx + 3
    }

    const hasCarriageReturns = buf.subarray(0, headerEnd).includes(0x0d)
    if (hasCarriageReturns) {
        return {
            valid: false,
            isValid: false,
            firstFourBytesHex,
            byteOffset: 0,
            hasBom: false,
            hasCarriageReturns: true,
            errorCode: 'CARRIAGE_RETURN_NON_POSIX',
            message:
                'Byte-0 violation: Non-POSIX carriage return (0x0D) detected in header block.',
        }
    }

    return {
        valid: true,
        isValid: true,
        firstFourBytesHex,
        byteOffset: 0,
        hasBom: false,
        hasCarriageReturns: false,
    }
}

/**
 * Extracts raw YAML frontmatter and raw Markdown prose body from a Byte-0 buffer.
 */
export function extractRawFrontmatterAndBody(
    content: Buffer | Uint8Array | string,
): {
    rawYaml: string
    proseBody: string
} {
    const text =
        typeof content === 'string'
            ? content
            : Buffer.from(content).toString('utf8')

    // Must start with ---\n
    if (!text.startsWith('---\n')) {
        throw new Error(
            '[BYTE_0_EXTRACT_ERROR] Content does not begin with ---\\n',
        )
    }

    const closingIndex = text.indexOf('\n---\n', 4)
    if (closingIndex === -1) {
        // Also check trailing closing delimiter at EOF
        if (text.endsWith('\n---')) {
            const rawYaml = text.slice(4, text.length - 4)
            return { rawYaml, proseBody: '' }
        }
        throw new Error(
            '[BYTE_0_EXTRACT_ERROR] Missing closing frontmatter delimiter (\\n---\\n)',
        )
    }

    const rawYaml = text.slice(4, closingIndex)
    const proseBody = text.slice(closingIndex + 5)

    return { rawYaml, proseBody }
}

/**
 * Extracts and validates a Markdown dossier with strict schema checking and deep freezing.
 */
export function extractByteZeroFactDossier<T>(
    filePath: string,
    content: Buffer | Uint8Array | string,
    validator?: (data: unknown) => T,
): DossierExtractionResult<T> {
    const byteCheck = verifyByteZeroIntegrity(content)
    if (!byteCheck.valid) {
        return {
            valid: false,
            filePath,
            errorCode: byteCheck.errorCode || 'MISSING_BYTE_ZERO_DELIMITER',
            message: byteCheck.message || 'Byte-0 verification failed',
        }
    }

    let extracted: { rawYaml: string; proseBody: string }
    try {
        extracted = extractRawFrontmatterAndBody(content)
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        return {
            valid: false,
            filePath,
            errorCode: 'MISSING_CLOSING_DELIMITER',
            message: errorMsg,
        }
    }

    let parsedYaml: unknown
    try {
        parsedYaml = yaml.load(extracted.rawYaml)
    } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        return {
            valid: false,
            filePath,
            errorCode: 'MALFORMED_YAML_PAYLOAD',
            message: `Failed to parse YAML frontmatter: ${errorMsg}`,
        }
    }

    let validatedData: T
    if (validator) {
        try {
            validatedData = validator(parsedYaml)
        } catch (err: unknown) {
            const errorMsg = err instanceof Error ? err.message : String(err)
            return {
                valid: false,
                filePath,
                errorCode: 'SCHEMA_VALIDATION_FAILURE',
                message: `Frontmatter schema validation failed: ${errorMsg}`,
            }
        }
    } else {
        validatedData = parsedYaml as T
    }

    const frozenFrontmatter = deepFreeze(validatedData)

    return {
        valid: true,
        filePath,
        frontmatter: frozenFrontmatter,
        proseBody: extracted.proseBody,
        rawFrontmatterYaml: extracted.rawYaml,
        byteSize: Buffer.isBuffer(content)
            ? content.length
            : Buffer.from(content).length,
    }
}

/**
 * Hard fail-closed assertion for Byte-0 dossier extraction.
 * Throws an Error immediately at Stage T0 ($0.00) if any extraction invariant fails.
 */
export function assertByteZeroFactDossier<T>(
    filePath: string,
    content: Buffer | Uint8Array | string,
    validator?: (data: unknown) => T,
): ExtractedFactDossierBit<T> {
    const result = extractByteZeroFactDossier(filePath, content, validator)
    if (!result.valid) {
        const failure =
            result as import('../fce/byteZero.bit.js').DossierExtractionFailureBit
        throw new Error(
            `[BYTE_ZERO_BREACH] ${failure.errorCode}: ${failure.message} in file '${filePath}'`,
        )
    }
    return result
}
