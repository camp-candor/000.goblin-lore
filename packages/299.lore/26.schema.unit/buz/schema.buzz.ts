import * as yaml from 'js-yaml'
import { createHash } from 'node:crypto'
import { CharacterFrontmatterSchema } from '../val/characterFrontmatter.val.js'
import { LocationFrontmatterSchema } from '../val/locationFrontmatter.val.js'
import { PossessionFrontmatterSchema } from '../../15.item.unit/val/item.val.js'
import { GrievanceFrontmatterSchema } from '../../13.grievance.unit/val/grievance.val.js'
import {
    validateScalarBoundsBuzz,
    type ThresholdValidationResult,
} from '../../35.threshold.unit/buz/threshold.buzz.js'
import {
    type DualRailCharacterBit,
    type VoiceRailSectionsBit,
} from '../fce/characterDossier.bit.js'
import type SchemaBit from '../fce/schema.bit.js'
import { SchemaModel } from '../schema.model.js'
import type State from '../../99.core/state.js'

export const initSchema = (cpy: SchemaModel, bal: SchemaBit, ste: State) => {
    return cpy
}

export const updateSchema = (cpy: SchemaModel, bal: SchemaBit, ste: State) => {
    return cpy
}

/**
 * Recursively freezes an object tree for deep runtime immutability.
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
    return Object.freeze(obj)
}

/**
 * Validates that raw text adheres strictly to the Byte-0 Frontmatter Law.
 */
export function verifyByteZeroOffset(raw: string | Buffer): {
    valid: boolean
    errorCode?: string
} {
    const buf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'utf8')

    // Traps UTF-8 BOM (0xEF 0xBB 0xBF)
    if (
        buf.length >= 3 &&
        buf[0] === 0xef &&
        buf[1] === 0xbb &&
        buf[2] === 0xbf
    ) {
        return { valid: false, errorCode: 'BYTE_0_BOM_VIOLATION' }
    }

    // Traps missing --- delimiter (0x2D 0x2D 0x2D)
    if (
        buf.length < 3 ||
        buf[0] !== 0x2d ||
        buf[1] !== 0x2d ||
        buf[2] !== 0x2d
    ) {
        return { valid: false, errorCode: 'BYTE_0_DELIMITER_MISSING' }
    }

    // Traps non-POSIX line endings following ---
    if (buf[3] === 0x0d) {
        return { valid: false, errorCode: 'NON_POSIX_CARRIAGE_RETURN' }
    }
    if (buf[3] !== 0x0a) {
        return { valid: false, errorCode: 'BYTE_0_NEWLINE_MISSING' }
    }

    return { valid: true }
}

/**
 * Splits raw Markdown dossier text into Byte-0 Frontmatter and Voice Rail sections.
 */
export function extractDossierSections(fileContent: string): {
    frontmatterText: string
    bodyText: string
} {
    const byteCheck = verifyByteZeroOffset(fileContent)
    if (!byteCheck.valid) {
        throw new Error(`[BYTE_ZERO_FAIL]: ${byteCheck.errorCode}`)
    }

    const normalized = fileContent.replace(/\r\n/g, '\n')
    const match = normalized.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
    if (!match) {
        throw new Error(
            '[SYNTAX_FAIL]: Closing frontmatter delimiter "---" missing or malformed.',
        )
    }

    return {
        frontmatterText: match[1],
        bodyText: match[2].trim(),
    }
}

/**
 * Parses Markdown heading sections into the VoiceRailSectionsBit contract.
 */
export function parseVoiceRailBody(body: string): VoiceRailSectionsBit {
    const extractH2 = (title: string): string => {
        const regex = new RegExp(
            `(?:^|\\n)## ${title}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`,
        )
        const m = body.match(regex)
        return m ? m[1].replace(/<!--[\s\S]*?-->/g, '').trim() : ''
    }

    const fewShotRaw = extractH2('Few-shot lines')
    const fewShotLines = fewShotRaw
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.startsWith('-') || line.startsWith('*'))
        .map((line) => line.replace(/^[-*]\s*/, '').trim())

    return {
        wantsSurface: extractH2('Wants \\(surface\\)'),
        wantsActual: extractH2('Wants \\(actual\\)'),
        blindSpot: extractH2('Blind spot'),
        voiceNotes: extractH2('Voice notes'),
        fewShotLines,
    }
}

/**
 * Buzzer action validating raw dossier text and assembling a DualRailCharacterBit.
 */
export const validateCharacterDossier = (
    cpy: SchemaModel,
    bal: SchemaBit,
    ste: State,
): SchemaModel => {
    try {
        const rawContent: string = bal.dat?.rawContent || ''
        const { frontmatterText, bodyText } = extractDossierSections(rawContent)

        // Parse YAML & validate via strict Zod schema
        const parsedYaml = yaml.load(frontmatterText, {
            schema: yaml.FAILSAFE_SCHEMA,
        }) as Record<string, unknown>
        const machineRail = CharacterFrontmatterSchema.parse(parsedYaml)

        // Parse Voice Rail markdown sections
        const voiceRail = parseVoiceRailBody(bodyText)

        // Compute deterministic SHA-256 content digest
        const contentSha256 = createHash('sha256')
            .update(rawContent, 'utf8')
            .digest('hex')

        const characterDossier: DualRailCharacterBit = deepFreeze({
            machineRail,
            voiceRail,
            byteZeroVerified: true,
            contentSha256,
        })

        if (bal.slv) {
            bal.slv({
                schemaBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: characterDossier,
                },
            })
        }
    } catch (err: any) {
        if (bal.slv) {
            bal.slv({
                schemaBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: {
                        error: err.message,
                        zodIssues: err.issues || null,
                    },
                },
            })
        }
    }
    return cpy
}

export interface SchemaVerificationReport {
    readonly success: boolean
    readonly entity_type: string
    readonly entity_id: string
    readonly code: string
    readonly errors: readonly string[]
}

/**
 * Validates candidate frontmatter payloads against their strict Zod contracts.
 */
export function verifyFrontmatterContractBuzz(
    entityType: 'character' | 'location' | 'possession' | 'grievance',
    payload: unknown,
): SchemaVerificationReport {
    let schema: any
    switch (entityType) {
        case 'character':
            schema = CharacterFrontmatterSchema
            break
        case 'location':
            schema = LocationFrontmatterSchema
            break
        case 'possession':
            schema = PossessionFrontmatterSchema
            break
        case 'grievance':
            schema = GrievanceFrontmatterSchema
            break
        default:
            return {
                success: false,
                entity_type: 'unknown',
                entity_id: 'unknown',
                code: 'UNSUPPORTED_ENTITY_TYPE',
                errors: [`Entity type "${entityType}" is not supported`],
            }
    }

    const result = schema.safeParse(payload)
    if (!result.success) {
        const errors = result.error.issues.map(
            (issue: any) =>
                `${issue.path.join('.') || 'root'}: ${issue.message}`,
        )
        const candidateId =
            typeof payload === 'object' && payload !== null && 'id' in payload
                ? String((payload as { id: unknown }).id)
                : 'unknown'

        return {
            success: false,
            entity_type: entityType,
            entity_id: candidateId,
            code: 'SCHEMA_VALIDATION_FAILURE',
            errors,
        }
    }

    const validData = result.data as { id: string }
    return {
        success: true,
        entity_type: entityType,
        entity_id: validData.id,
        code: 'OK',
        errors: [],
    }
}

export { validateScalarBoundsBuzz }
export type { ThresholdValidationResult }
