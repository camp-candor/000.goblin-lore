import { z } from 'zod'

/**
 * Regular Expression Contracts for 06.facts.unit:
 * - FACT_ID_REGEX: Strictly begins with 'fact_', followed by lowercase alphanumeric or underscores.
 * - AUTHOR_HANDLE_REGEX: Strictly lowercase alphanumeric or underscores.
 * - SHA256_HEX_REGEX: Strictly 64 lowercase hexadecimal characters.
 */
export const FACT_ID_REGEX = /^fact_[a-z0-9_]+$/
export const AUTHOR_HANDLE_REGEX = /^[a-z0-9_]+$/
export const SHA256_HEX_REGEX = /^[0-9a-f]{64}$/

/**
 * Zod Schema validating fact identifier strings.
 */
export const FactIdSchema = z
    .string({
        required_error: 'Fact ID is required',
        invalid_type_error: 'Fact ID must be a string',
    })
    .min(6, 'Fact ID must be at least 6 characters (fact_x)')
    .max(128, 'Fact ID must not exceed 128 characters')
    .regex(
        FACT_ID_REGEX,
        'Fact ID must match pattern ^fact_[a-z0-9_]+$ (strictly lowercase snake_case prefixed with fact_)',
    )

export type FactId = z.infer<typeof FactIdSchema>

/**
 * Zod Schema validating author identifier handles.
 */
export const AuthorHandleSchema = z
    .string({
        required_error: 'Author handle is required',
        invalid_type_error: 'Author handle must be a string',
    })
    .min(1, 'Author handle cannot be empty')
    .max(64, 'Author handle must not exceed 64 characters')
    .regex(
        AUTHOR_HANDLE_REGEX,
        'Author handle must match pattern ^[a-z0-9_]+$ (strictly lowercase snake_case)',
    )

export type AuthorHandle = z.infer<typeof AuthorHandleSchema>

/**
 * Zod Schema validating SHA-256 hexadecimal digests.
 */
export const Sha256HashSchema = z
    .string({
        required_error: 'Content hash is required',
        invalid_type_error: 'Content hash must be a string',
    })
    .length(64, 'Content hash must be exactly 64 characters')
    .regex(
        SHA256_HEX_REGEX,
        'Content hash must match pattern ^[0-9a-f]{64}$ (strictly lowercase hexadecimal)',
    )

export type Sha256Hash = z.infer<typeof Sha256HashSchema>
