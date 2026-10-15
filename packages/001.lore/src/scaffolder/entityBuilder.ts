import * as fs from 'node:fs'
import * as path from 'node:path'
import * as yaml from 'js-yaml'
import {
    CharacterSchema,
    PossessionSchema,
    LocationSchema,
    RefusalVector,
} from '../schemas/entities.js'

export interface DualRailVoiceStubs {
    wantsSurface: string
    wantsActual: string
    blindSpot: string
    voiceNotes: string
    refusalVectors?: RefusalVector[]
}

/**
 * Enforces the Byte-0 Frontmatter Law:
 * 1. Output starts strictly at byte 0 with "---" (0x2D 0x2D 0x2D 0x0A).
 * 2. Prohibits UTF-8 BOM, leading whitespace, and carriage returns (\r).
 * 3. Formats the human voice rail under standardized markdown section stubs.
 */
export function buildByteZeroDossier(
    frontmatter: object,
    voice: DualRailVoiceStubs,
): string {
    const yamlContent = yaml
        .dump(frontmatter, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: true,
        })
        .trim()

    let refusalSection = ''
    if (voice.refusalVectors && voice.refusalVectors.length > 0) {
        refusalSection =
            `\n## Refusal Vectors\n` +
            voice.refusalVectors
                .map(
                    (rv) =>
                        `* **Trigger:** ${rv.trigger_condition}\n` +
                        `  * **Mandatory Refusal:** ${rv.mandatory_refusal}\n` +
                        `  * **Unavoidable Cost:** ${rv.unavoidable_cost}`,
                )
                .join('\n')
    }

    const voiceRail = [
        `## Wants (surface)`,
        voice.wantsSurface.trim(),
        ``,
        `## Wants (actual)`,
        voice.wantsActual.trim(),
        ``,
        `## Blind spot`,
        voice.blindSpot.trim(),
        ``,
        `## Voice notes`,
        voice.voiceNotes.trim(),
        refusalSection,
    ]
        .join('\n')
        .trim()

    // POSIX LF normalized, byte-exact opening delimiter
    const dossier = `---\n${yamlContent}\n---\n\n${voiceRail}\n`
    return dossier.replace(/\r\n/g, '\n')
}

/**
 * Validates that an in-memory buffer or file adheres to the Byte-0 Frontmatter Law.
 */
export function verifyByteZeroIntegrity(content: Buffer | string): {
    valid: boolean
    error?: string
} {
    const buf = Buffer.isBuffer(content)
        ? content
        : Buffer.from(content, 'utf8')

    // Check for UTF-8 BOM (0xEF, 0xBB, 0xBF)
    if (
        buf.length >= 3 &&
        buf[0] === 0xef &&
        buf[1] === 0xbb &&
        buf[2] === 0xbf
    ) {
        return {
            valid: false,
            error: 'BYTE_0_VIOLATION: UTF-8 BOM detected at byte offset 0.',
        }
    }

    // Check for --- delimiter at index 0 (0x2D, 0x2D, 0x2D)
    if (
        buf.length < 3 ||
        buf[0] !== 0x2d ||
        buf[1] !== 0x2d ||
        buf[2] !== 0x2d
    ) {
        return {
            valid: false,
            error: 'BYTE_0_VIOLATION: File does not start with "---" at byte index 0.',
        }
    }

    // Ensure byte 3 is LF (0x0A) or CR+LF (0x0D 0x0A)
    if (buf[3] !== 0x0a && !(buf[3] === 0x0d && buf[4] === 0x0a)) {
        return {
            valid: false,
            error: 'BYTE_0_VIOLATION: Delimiter not followed immediately by newline.',
        }
    }

    return { valid: true }
}

/**
 * Persists an entity dossier to disk atomically using sibling tmp files.
 */
export function commitDossierAtomically(
    targetPath: string,
    fileContent: string,
): void {
    const integrity = verifyByteZeroIntegrity(fileContent)
    if (!integrity.valid) {
        throw new Error(integrity.error)
    }

    const dir = path.dirname(targetPath)
    fs.mkdirSync(dir, { recursive: true })

    const tmpPath = path.join(
        dir,
        `.tmp_${path.basename(targetPath)}_${Date.now()}`,
    )
    fs.writeFileSync(tmpPath, fileContent, { encoding: 'utf8' })
    fs.renameSync(tmpPath, targetPath)
}
