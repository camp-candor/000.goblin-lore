import * as fs from 'node:fs'
import * as path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import * as yaml from 'js-yaml'
import { CharacterFrontmatterSchema } from '../../26.schema.unit/val/characterFrontmatter.val.js'
import {
    SerializeCharacterDossierConfigBit,
    SerializeCharacterDossierResultBit,
} from '../fce/serializer.bit.js'
import { CharacterModel } from '../character.model.js'
import CharacterBit from '../fce/character.bit.js'
import State from '../../99.core/state.js'

/**
 * Resolves repository root directory by walking upward from process.cwd()
 */
export function resolveRepoRoot(): string {
    let curr = process.cwd()
    while (curr !== path.dirname(curr)) {
        if (
            fs.existsSync(path.join(curr, 'series')) ||
            fs.existsSync(path.join(curr, 'package.json'))
        ) {
            return curr
        }
        curr = path.dirname(curr)
    }
    return process.cwd()
}

/**
 * Validates that binary buffer strictly adheres to Byte-0 Frontmatter Law.
 */
export function verifyByteZeroOffset(buf: Buffer): {
    valid: boolean
    errorCode?: string
} {
    if (
        buf.length >= 3 &&
        buf[0] === 0xef &&
        buf[1] === 0xbb &&
        buf[2] === 0xbf
    ) {
        return { valid: false, errorCode: 'BYTE_0_BOM_VIOLATION' }
    }
    if (
        buf.length < 4 ||
        buf[0] !== 0x2d ||
        buf[1] !== 0x2d ||
        buf[2] !== 0x2d
    ) {
        return { valid: false, errorCode: 'BYTE_0_DELIMITER_MISSING' }
    }
    if (buf[3] === 0x0d) {
        return { valid: false, errorCode: 'NON_POSIX_CARRIAGE_RETURN' }
    }
    if (buf[3] !== 0x0a) {
        return { valid: false, errorCode: 'BYTE_0_NEWLINE_MISSING' }
    }
    return { valid: true }
}

/**
 * Strips citation markers and HTML comment templates from voice rail prose.
 */
export function sanitizeVoiceRailProse(text: string): string {
    if (!text) return ''
    return text
        .replace(/\[cite:\s*[\d,\s]+\]/g, '')
        .replace(/<!--[\s\S]*?-->/g, '')
        .trim()
}

/**
 * Builds the Byte-0 Dual-Rail Markdown string from structured frontmatter and voice rail.
 */
export function buildCharacterDossierMarkdown(
    config: SerializeCharacterDossierConfigBit,
): { characterId: string; markdownContent: string } {
    // Validate Machine Rail Frontmatter Schema at T0 ($0.00)
    const validatedFrontmatter = CharacterFrontmatterSchema.parse(
        config.frontmatter,
    )

    // Hand Saturation SAT Invariant Check
    const heldItemsCount = validatedFrontmatter.logistical.held.length
    const availableArms =
        validatedFrontmatter.somatic.available_arms_bps / 10000
    if (heldItemsCount > availableArms) {
        throw new Error(
            `[HAND_CAPACITY_SAT_VIOLATION]: Held items (${heldItemsCount}) exceed available arms (${availableArms})`,
        )
    }

    const yamlString = yaml.dump(validatedFrontmatter, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    })

    const wantsSurface = sanitizeVoiceRailProse(config.voiceRail.wantsSurface)
    const wantsActual = sanitizeVoiceRailProse(config.voiceRail.wantsActual)
    const blindSpot = sanitizeVoiceRailProse(config.voiceRail.blindSpot)
    const voiceNotes = sanitizeVoiceRailProse(config.voiceRail.voiceNotes)

    const fewShotFormatted = (config.voiceRail.fewShotLines || [])
        .map((line) => sanitizeVoiceRailProse(line))
        .filter((line) => line.length > 0)
        .map((line) => (line.startsWith('- ') ? line : `- ${line}`))
        .join('\n')

    // Strict Byte-0 Frontmatter Opening: Starts with --- at index 0
    const markdownContent =
        `---\n${yamlString}---\n\n` +
        `## Wants (surface)\n${wantsSurface}\n\n` +
        `## Wants (actual)\n${wantsActual}\n\n` +
        `## Blind spot\n${blindSpot}\n\n` +
        `## Voice notes\n${voiceNotes}\n\n` +
        `## Few-shot lines\n${fewShotFormatted}\n`

    return { characterId: validatedFrontmatter.id, markdownContent }
}

/**
 * Atomically writes a validated character dossier to local disk.
 */
export function serializeCharacterDossierToDisk(
    config: SerializeCharacterDossierConfigBit,
): SerializeCharacterDossierResultBit {
    if (!config.seriesSlug || config.seriesSlug.trim().length === 0) {
        throw new Error(
            '[SERIALIZER_FAIL]: seriesSlug is required for dossier persistence.',
        )
    }

    const root = config.customRoot || resolveRepoRoot()
    const charactersDir = path.join(
        root,
        'series',
        config.seriesSlug,
        'characters',
    )

    if (!fs.existsSync(charactersDir)) {
        fs.mkdirSync(charactersDir, { recursive: true })
    }

    const { characterId, markdownContent } =
        buildCharacterDossierMarkdown(config)
    const targetFilePath = path.join(charactersDir, `${characterId}.md`)
    const fileBuffer = Buffer.from(markdownContent, 'utf8')

    // Verify Byte-0 Law before write
    const byteCheck = verifyByteZeroOffset(fileBuffer)
    if (!byteCheck.valid) {
        throw new Error(`[BYTE_ZERO_FAIL]: ${byteCheck.errorCode}`)
    }

    // Atomic POSIX write pattern via .tmp_[UUID]
    const tempFilePath = path.join(charactersDir, `.tmp_${randomUUID()}`)
    fs.writeFileSync(tempFilePath, fileBuffer)
    fs.renameSync(tempFilePath, targetFilePath)

    const contentSha256 = createHash('sha256').update(fileBuffer).digest('hex')

    return {
        characterId,
        filePath: targetFilePath,
        byteZeroVerified: true,
        contentSha256,
    }
}

/**
 * Buzzer action validating and writing character dossier through state dispatcher.
 */
export const serializeCharacterDossier = (
    cpy: CharacterModel,
    bal: CharacterBit,
    ste: State,
): CharacterModel => {
    try {
        const config: SerializeCharacterDossierConfigBit = bal.dat
        if (!config) {
            throw new Error(
                '[SERIALIZER_FAIL]: Missing SerializeCharacterDossierConfigBit payload.',
            )
        }

        const result = serializeCharacterDossierToDisk(config)

        if (bal.slv) {
            bal.slv({
                characterBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: result,
                },
            })
        }
    } catch (err: any) {
        if (bal.slv) {
            bal.slv({
                characterBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: {
                        error: err.message,
                    },
                },
            })
        }
    }
    return cpy
}
