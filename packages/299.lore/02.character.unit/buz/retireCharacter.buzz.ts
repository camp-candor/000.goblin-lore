import * as fs from 'node:fs'
import * as path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import * as yaml from 'js-yaml'
import {
    RetireCharacterConfigBit,
    PreFlightRetireAuditResultBit,
    RetireCharacterResultBit,
} from '../fce/retireCharacter.bit.js'
import { CharacterModel } from '../character.model.js'
import CharacterBit from '../fce/character.bit.js'
import State from '../../99.core/state.js'

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
 * Runs a pre-flight dependency sweep checking active equipment, leverage strings,
 * and primary grievance participants before allowing retirement to proceed.
 */
export function preFlightRetireAudit(
    seriesSlug: string,
    characterId: string,
    customRoot?: string,
): PreFlightRetireAuditResultBit {
    const root = customRoot || resolveRepoRoot()
    const charactersDir = path.join(root, 'series', seriesSlug, 'characters')
    const grievancesDir = path.join(root, 'series', seriesSlug, 'grievances')

    const blockingReferences: string[] = []
    const heldPossessions: string[] = []
    const activeLeverageHolders: string[] = []
    const unresolvedGrievances: string[] = []

    const targetFile = path.join(charactersDir, `${characterId}.md`)
    if (!fs.existsSync(targetFile)) {
        throw new Error(
            `[RETIRE_AUDIT_FAIL]: Character dossier not found: ${targetFile}`,
        )
    }

    // 1. Conservation of Matter: Check retiring character's own equipment slots
    const targetRaw = fs.readFileSync(targetFile, 'utf8')
    const targetParts = targetRaw.split('---\n')
    if (targetParts.length >= 3) {
        const frontmatter = yaml.load(targetParts[1]) as Record<string, any>
        const logistical = frontmatter.logistical || {}
        const held = logistical.held || []
        const worn = logistical.worn || []
        const carried = logistical.carried || []

        const activeItems = [...held, ...worn, ...carried]
        for (const item of activeItems) {
            heldPossessions.push(item)
            blockingReferences.push(
                `[CONSERVATION_OF_MATTER] Character actively holds item '${item}'. Reassign or drop to spatial node first.`,
            )
        }
    }

    // 2. Relational Debt Sweep: Scan surviving characters for active leverage over target
    if (fs.existsSync(charactersDir)) {
        const characterFiles = fs
            .readdirSync(charactersDir)
            .filter((f) => f.endsWith('.md') && f !== `${characterId}.md`)

        for (const file of characterFiles) {
            const charPath = path.join(charactersDir, file)
            const raw = fs.readFileSync(charPath, 'utf8')
            const parts = raw.split('---\n')
            if (parts.length >= 3) {
                const fm = yaml.load(parts[1]) as Record<string, any>
                const epistemic = fm.epistemic || {}
                const stringsHeldOver = epistemic.strings_held_over || []
                const leverageStrings = epistemic.leverage_strings || {}

                if (
                    stringsHeldOver.includes(characterId) ||
                    (leverageStrings[characterId] &&
                        leverageStrings[characterId] > 0)
                ) {
                    const holderId = fm.id || file.replace('.md', '')
                    activeLeverageHolders.push(holderId)
                    blockingReferences.push(
                        `[ACTIVE_LEVERAGE_DEBT] Character '${holderId}' holds unliquidated leverage over '${characterId}'.`,
                    )
                }
            }
        }
    }

    // 3. Narrative Grievance Sweep: Scan active grievances for primary participation
    if (fs.existsSync(grievancesDir)) {
        const grievanceFiles = fs
            .readdirSync(grievancesDir)
            .filter((f) => f.endsWith('.md'))
        for (const file of grievanceFiles) {
            const grvPath = path.join(grievancesDir, file)
            const raw = fs.readFileSync(grvPath, 'utf8')
            const parts = raw.split('---\n')
            if (parts.length >= 3) {
                const fm = yaml.load(parts[1]) as Record<string, any>
                const participants = fm.participants_primary || []
                if (participants.includes(characterId)) {
                    const grvId = fm.id || file.replace('.md', '')
                    unresolvedGrievances.push(grvId)
                    blockingReferences.push(
                        `[ACTIVE_GRIEVANCE_BLOCK] Grievance '${grvId}' relies on '${characterId}' as a primary participant.`,
                    )
                }
            }
        }
    }

    return {
        canRetireSafely: blockingReferences.length === 0,
        blockingReferences,
        heldPossessions,
        activeLeverageHolders,
        unresolvedGrievances,
    }
}

/**
 * Executes guardrailed character retirement: validates pre-conditions, updates frontmatter
 * in-place with tombstone metadata and banned_kinetic_verbs: ["*"], and atomically migrates
 * the dossier to series/<seriesSlug>/characters/_retired/<characterId>.md.
 */
export function retireCharacterDossier(
    config: RetireCharacterConfigBit,
): RetireCharacterResultBit {
    if (!config.seriesSlug || !config.characterId) {
        throw new Error(
            '[RETIRE_FAIL]: seriesSlug and characterId are required for retirement.',
        )
    }

    const root = config.customRoot || resolveRepoRoot()
    const charactersDir = path.join(
        root,
        'series',
        config.seriesSlug,
        'characters',
    )
    const retiredDir = path.join(charactersDir, '_retired')

    const sourceFilePath = path.join(charactersDir, `${config.characterId}.md`)
    const targetFilePath = path.join(retiredDir, `${config.characterId}.md`)

    if (!fs.existsSync(sourceFilePath)) {
        throw new Error(
            `[RETIRE_FAIL]: Source character dossier not found: ${sourceFilePath}`,
        )
    }

    // Execute pre-flight relational graph audit
    const audit = preFlightRetireAudit(
        config.seriesSlug,
        config.characterId,
        root,
    )
    if (!audit.canRetireSafely) {
        const errorLog = audit.blockingReferences
            .map((ref) => `  >> ${ref}`)
            .join('\n')
        throw new Error(
            `[RETIREMENT_DANGLING_REFERENCE_BLOCK]: Cannot retire '${config.characterId}'. Active dependencies detected:\n${errorLog}`,
        )
    }

    if (!fs.existsSync(retiredDir)) {
        fs.mkdirSync(retiredDir, { recursive: true })
    }

    const rawContent = fs.readFileSync(sourceFilePath, 'utf8')
    const parts = rawContent.split('---\n')
    if (parts.length < 3) {
        throw new Error(
            `[RETIRE_FAIL]: Malformed dossier frontmatter in ${sourceFilePath}`,
        )
    }

    const frontmatter = yaml.load(parts[1]) as Record<string, any>
    const voiceRailProse = parts.slice(2).join('---\n')

    // Compute canonical tombstone hash over rationale and cycle
    const tombstoneHash = createHash('sha256')
        .update(
            `${config.characterId}:${config.retiredAtCycle}:${config.departureType}:${config.resolutionCause}`,
        )
        .digest('hex')

    // Inject Tombstone Machine Rail Metadata
    frontmatter.status = 'DEPRECATED_ARCHIVED'
    frontmatter.somatic = frontmatter.somatic || {}
    frontmatter.somatic.locomotion_baseline = 'sessile'
    frontmatter.somatic.available_arms_bps = 0

    // Mask all future kinetic animation and blocking
    const currentBanned = new Set(
        frontmatter.somatic.banned_kinetic_verbs || [],
    )
    currentBanned.add('*')
    frontmatter.somatic.banned_kinetic_verbs = Array.from(currentBanned)

    frontmatter.lifecycle = {
        retired_at_cycle: config.retiredAtCycle,
        departure_type: config.departureType,
        resolution_cause: config.resolutionCause,
        canonical_tombstone_hash: tombstoneHash,
    }

    const updatedYaml = yaml.dump(frontmatter, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    })

    const retiredMarkdownContent = `---\n${updatedYaml}---\n${voiceRailProse}`
    const fileBuffer = Buffer.from(retiredMarkdownContent, 'utf8')

    // Verify Byte-0 Delimiter Law
    const byteCheck = verifyByteZeroOffset(fileBuffer)
    if (!byteCheck.valid) {
        throw new Error(`[BYTE_ZERO_FAIL]: ${byteCheck.errorCode}`)
    }

    // Atomic POSIX write pattern in target directory
    const tempFilePath = path.join(retiredDir, `.tmp_${randomUUID()}`)
    fs.writeFileSync(tempFilePath, fileBuffer)
    fs.renameSync(tempFilePath, targetFilePath)

    // Remove source active dossier now that retired archive is sealed
    fs.unlinkSync(sourceFilePath)

    return {
        characterId: config.characterId,
        oldPath: sourceFilePath,
        newPath: targetFilePath,
        byteZeroVerified: true,
        tombstoneHash,
        reconciledReferencesCount: 0,
    }
}

/**
 * Buzzer action validating and executing character retirement through state dispatcher.
 */
export const retireCharacter = (
    cpy: CharacterModel,
    bal: CharacterBit,
    ste: State,
): CharacterModel => {
    try {
        const config: RetireCharacterConfigBit = bal.dat
        if (!config) {
            throw new Error(
                '[RETIRE_FAIL]: Missing RetireCharacterConfigBit payload.',
            )
        }

        const result = retireCharacterDossier(config)

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
