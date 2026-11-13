import * as fs from 'node:fs'
import * as path from 'node:path'
import * as crypto from 'node:crypto'
import yaml from 'js-yaml'
import type State from '../../99.core/state.js'
import type { LogisticModel } from '../logistic.model.js'
import type {
    RetireCanonicalEntityPayload,
    RetireCanonicalEntityReceipt,
    ActiveRecipientSnapshot,
    default as LogisticBit,
} from '../fce/logistic.bit.js'
import type {
    CharacterLogisticalVector,
    PossessionLogisticalVector,
} from '../val/logistic.val.js'
import { reconcileRetiredEntityPossessions } from './matterConservation.buzz.js'

interface ParsedDossier {
    frontmatter: Record<string, any>
    bodyContent: string
}

function resolveRepoRoot(startDir: string = process.cwd()): string {
    let curr = path.resolve(startDir)
    for (let i = 0; i < 6; i++) {
        if (
            fs.existsSync(path.join(curr, 'packages', '299.lore')) ||
            fs.existsSync(path.join(curr, 'series'))
        ) {
            return curr
        }
        const parent = path.dirname(curr)
        if (parent === curr) break
        curr = parent
    }
    return path.resolve(startDir)
}

function parseByteZeroDossier(
    rawContent: string,
    fileLabel: string,
): ParsedDossier {
    const buf = Buffer.from(rawContent, 'utf8')
    if (
        buf.length >= 3 &&
        buf[0] === 0xef &&
        buf[1] === 0xbb &&
        buf[2] === 0xbf
    ) {
        throw new Error(
            `[BYTE_ZERO_BREACH] UTF-8 BOM detected at offset 0 in ${fileLabel}`,
        )
    }
    if (
        buf.length < 4 ||
        buf[0] !== 0x2d ||
        buf[1] !== 0x2d ||
        buf[2] !== 0x2d ||
        buf[3] !== 0x0a
    ) {
        throw new Error(
            `[BYTE_ZERO_BREACH] Missing opening "---\\n" at byte 0 in ${fileLabel}`,
        )
    }

    const normalized = rawContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    const parts = normalized.split(/^---$/m)
    if (parts.length < 3) {
        throw new Error(
            `[BYTE_ZERO_BREACH] Unclosed YAML frontmatter in ${fileLabel}`,
        )
    }

    const frontmatter = (yaml.load(parts[1]) as Record<string, any>) || {}
    const bodyContent = parts.slice(2).join('---')
    return { frontmatter, bodyContent }
}

function serializeByteZeroDossier(
    frontmatter: Record<string, any>,
    bodyContent: string,
): string {
    const dumpedYaml = yaml
        .dump(frontmatter, {
            indent: 2,
            lineWidth: -1,
            noRefs: true,
            sortKeys: true,
        })
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        .trim()

    const cleanBody = bodyContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
    return `---\n${dumpedYaml}\n---${cleanBody}`
}

function writeAtomicPosixFile(targetFilePath: string, content: string): void {
    const dir = path.dirname(targetFilePath)
    const baseName = path.basename(targetFilePath, '.md')
    fs.mkdirSync(dir, { recursive: true })
    const tmpPath = path.join(
        dir,
        `.tmp_${crypto.randomUUID()}_${baseName}.md.tmp`,
    )
    fs.writeFileSync(tmpPath, content, 'utf8')
    fs.renameSync(tmpPath, targetFilePath)
}

function computeCorpusMerkleSeal(seriesDir: string): string {
    const hash = crypto.createHash('sha256')
    const subdirs = ['characters', 'locations', 'possessions', 'grievances']
    for (const sub of subdirs) {
        const dirPath = path.join(seriesDir, sub)
        if (!fs.existsSync(dirPath)) continue
        const entries = fs
            .readdirSync(dirPath)
            .filter((f) => f.endsWith('.md'))
            .sort()
        for (const entry of entries) {
            const full = path.join(dirPath, entry)
            hash.update(`${sub}/${entry}:`)
            hash.update(fs.readFileSync(full))
        }
    }
    return hash.digest('hex')
}

export async function retireCanonicalEntity(
    payload: RetireCanonicalEntityPayload,
): Promise<RetireCanonicalEntityReceipt> {
    const {
        seriesSlug,
        characterId,
        departureType,
        resolutionCause,
        departureEpoch,
        itemTransfers,
        sealCallback,
    } = payload

    const repoRoot = payload.repoRoot || resolveRepoRoot()
    const seriesDir = path.join(repoRoot, 'series', seriesSlug)
    const charsDir = path.join(seriesDir, 'characters')
    const retiredCharsDir = path.join(charsDir, '_retired')
    const oldPath = path.join(charsDir, `${characterId}.md`)
    const newPath = path.join(retiredCharsDir, `${characterId}.md`)

    if (!fs.existsSync(oldPath)) {
        return {
            success: false,
            characterId,
            oldPath,
            newPath,
            archivedGrievances: [],
            updatedPossessions: [],
            rootMerkleHash: '',
            byteZeroVerified: false,
            errorCode: 'ENTITY_NOT_FOUND',
            errors: [
                `[ENTITY_NOT_FOUND] Character dossier '${oldPath}' does not exist`,
            ],
        }
    }

    let parsedChar: ParsedDossier
    try {
        parsedChar = parseByteZeroDossier(
            fs.readFileSync(oldPath, 'utf8'),
            `${characterId}.md`,
        )
    } catch (err: any) {
        return {
            success: false,
            characterId,
            oldPath,
            newPath,
            archivedGrievances: [],
            updatedPossessions: [],
            rootMerkleHash: '',
            byteZeroVerified: false,
            errorCode: 'BYTE_ZERO_BREACH',
            errors: [err.message],
        }
    }

    const locationsDir = path.join(seriesDir, 'locations')
    const validLocationIds: string[] = fs.existsSync(locationsDir)
        ? fs
              .readdirSync(locationsDir)
              .filter((f) => f.endsWith('.md'))
              .map((f) => path.basename(f, '.md'))
        : []

    const activeCharacters: Record<string, ActiveRecipientSnapshot> = {}
    const activeCharFiles = fs
        .readdirSync(charsDir)
        .filter((f) => f.endsWith('.md'))
    for (const file of activeCharFiles) {
        const cId = path.basename(file, '.md')
        if (cId === characterId) continue
        const cParsed = parseByteZeroDossier(
            fs.readFileSync(path.join(charsDir, file), 'utf8'),
            file,
        )
        const fm = cParsed.frontmatter
        const armsBps =
            typeof fm.somatic?.available_arms_bps === 'number'
                ? fm.somatic.available_arms_bps
                : 20000
        const vector: CharacterLogisticalVector = {
            entity_id: cId,
            worn: Array.isArray(fm.worn) ? fm.worn : [],
            held: Array.isArray(fm.held) ? fm.held : [],
            carried: Array.isArray(fm.carried) ? fm.carried : [],
            cached: fm.cached && typeof fm.cached === 'object' ? fm.cached : {},
        }
        activeCharacters[cId] = {
            arms_available_bps: armsBps,
            vector,
            is_retired:
                fm.status === 'departed' || fm.status === 'DEPRECATED_ARCHIVED',
        }
    }

    const possessionsDir = path.join(seriesDir, 'possessions')
    const knownPossessions: Record<string, PossessionLogisticalVector> = {}
    const heldPossessions: PossessionLogisticalVector[] = []

    const directIds = new Set<string>([
        ...(Array.isArray(parsedChar.frontmatter.worn)
            ? parsedChar.frontmatter.worn
            : []),
        ...(Array.isArray(parsedChar.frontmatter.held)
            ? parsedChar.frontmatter.held
            : []),
        ...(Array.isArray(parsedChar.frontmatter.carried)
            ? parsedChar.frontmatter.carried
            : []),
    ])

    if (fs.existsSync(possessionsDir)) {
        const posFiles = fs
            .readdirSync(possessionsDir)
            .filter((f) => f.endsWith('.md'))
        for (const file of posFiles) {
            const pId = path.basename(file, '.md')
            const pParsed = parseByteZeroDossier(
                fs.readFileSync(path.join(possessionsDir, file), 'utf8'),
                file,
            )
            const fm = pParsed.frontmatter
            const vec: PossessionLogisticalVector = {
                item_id: pId,
                occupies_hands:
                    typeof fm.occupies_hands === 'number'
                        ? fm.occupies_hands
                        : 1,
                occupies_hands_bps:
                    typeof fm.occupies_hands_bps === 'number'
                        ? fm.occupies_hands_bps
                        : 10000,
                mass_grams:
                    typeof fm.mass_grams === 'number' ? fm.mass_grams : 100,
                weight_class: fm.weight_class || 'scrap',
                is_contested: Boolean(fm.is_contested),
                allowed_slots: Array.isArray(fm.allowed_slots)
                    ? fm.allowed_slots
                    : ['HELD_PRIMARY'],
                owner_id: fm.owner_id ?? null,
                location_id: fm.location_id ?? null,
            }
            knownPossessions[pId] = vec as unknown as PossessionLogisticalVector
            if (fm.owner_id === characterId || directIds.has(pId)) {
                heldPossessions.push(
                    vec as unknown as PossessionLogisticalVector,
                )
            }
        }
    } else {
        for (const pId of directIds) {
            const fallbackVec: PossessionLogisticalVector = {
                item_id: pId,
                occupies_hands: 1,
                occupies_hands_bps: 10000,
                mass_grams: 100,
                weight_class: 'scrap',
                is_contested: false,
                allowed_slots: ['HELD_PRIMARY'],
                owner_id: characterId,
                location_id: null,
            }
            knownPossessions[pId] =
                fallbackVec as unknown as PossessionLogisticalVector
            heldPossessions.push(
                fallbackVec as unknown as PossessionLogisticalVector,
            )
        }
    }

    const conservationReceipt = reconcileRetiredEntityPossessions({
        retiring_entity_id: characterId,
        held_possessions: heldPossessions,
        item_transfers: itemTransfers,
        active_characters: activeCharacters,
        valid_location_ids: validLocationIds,
        known_possessions: knownPossessions,
    })

    if (!conservationReceipt.valid) {
        return {
            success: false,
            characterId,
            oldPath,
            newPath,
            archivedGrievances: [],
            updatedPossessions: [],
            rootMerkleHash: '',
            byteZeroVerified: false,
            errorCode:
                conservationReceipt.errorCode || 'MATTER_CONSERVATION_BREACH',
            errors: conservationReceipt.errors,
        }
    }

    const updatedPossessions: string[] = []
    for (const state of conservationReceipt.updated_possession_states) {
        const posPath = path.join(possessionsDir, `${state.item_id}.md`)
        if (fs.existsSync(posPath)) {
            const pParsed = parseByteZeroDossier(
                fs.readFileSync(posPath, 'utf8'),
                `${state.item_id}.md`,
            )
            pParsed.frontmatter.owner_id = state.owner_id
            pParsed.frontmatter.location_id = state.location_id
            writeAtomicPosixFile(
                posPath,
                serializeByteZeroDossier(
                    pParsed.frontmatter,
                    pParsed.bodyContent,
                ),
            )
            updatedPossessions.push(state.item_id)
        }
    }

    for (const [recId, recVec] of Object.entries(
        conservationReceipt.updated_character_vectors,
    )) {
        const recPath = path.join(charsDir, `${recId}.md`)
        if (fs.existsSync(recPath)) {
            const rParsed = parseByteZeroDossier(
                fs.readFileSync(recPath, 'utf8'),
                `${recId}.md`,
            )
            rParsed.frontmatter.worn = recVec.worn
            rParsed.frontmatter.held = recVec.held
            rParsed.frontmatter.carried = recVec.carried
            rParsed.frontmatter.cached = recVec.cached
            writeAtomicPosixFile(
                recPath,
                serializeByteZeroDossier(
                    rParsed.frontmatter,
                    rParsed.bodyContent,
                ),
            )
        }
    }

    parsedChar.frontmatter.status = 'departed'
    parsedChar.frontmatter.banned_kinetic_verbs = ['*']
    parsedChar.frontmatter.departure_epoch = departureEpoch
    parsedChar.frontmatter.departure_type = departureType
    parsedChar.frontmatter.resolution_cause = resolutionCause
    parsedChar.frontmatter.worn = []
    parsedChar.frontmatter.held = []
    parsedChar.frontmatter.carried = []

    if (
        parsedChar.frontmatter.somatic &&
        typeof parsedChar.frontmatter.somatic === 'object'
    ) {
        parsedChar.frontmatter.somatic.banned_kinetic_verbs = ['*']
    }

    const serializedRetiredChar = serializeByteZeroDossier(
        parsedChar.frontmatter,
        parsedChar.bodyContent,
    )
    writeAtomicPosixFile(newPath, serializedRetiredChar)
    fs.unlinkSync(oldPath)

    const archivedGrievances: string[] = []
    const grievancesDir = path.join(seriesDir, 'grievances')
    const retiredGrievancesDir = path.join(grievancesDir, '_retired')
    if (fs.existsSync(grievancesDir)) {
        const grvFiles = fs
            .readdirSync(grievancesDir)
            .filter((f) => f.endsWith('.md'))
        for (const file of grvFiles) {
            const gId = path.basename(file, '.md')
            const gOldPath = path.join(grievancesDir, file)
            const gParsed = parseByteZeroDossier(
                fs.readFileSync(gOldPath, 'utf8'),
                file,
            )
            const primary = Array.isArray(
                gParsed.frontmatter.participants_primary,
            )
                ? gParsed.frontmatter.participants_primary
                : []
            if (primary.includes(characterId)) {
                gParsed.frontmatter.status = 'DEPRECATED_ARCHIVED'
                gParsed.frontmatter.archived_epoch = departureEpoch
                const gNewPath = path.join(retiredGrievancesDir, file)
                writeAtomicPosixFile(
                    gNewPath,
                    serializeByteZeroDossier(
                        gParsed.frontmatter,
                        gParsed.bodyContent,
                    ),
                )
                fs.unlinkSync(gOldPath)
                archivedGrievances.push(gId)
            }
        }
    }

    const rootMerkleHash = sealCallback
        ? await sealCallback(seriesSlug, repoRoot)
        : computeCorpusMerkleSeal(seriesDir)

    const retiredBuf = fs.readFileSync(newPath)
    const byteZeroVerified =
        retiredBuf.length >= 4 &&
        retiredBuf[0] === 0x2d &&
        retiredBuf[1] === 0x2d &&
        retiredBuf[2] === 0x2d &&
        retiredBuf[3] === 0x0a

    return {
        success: true,
        characterId,
        oldPath,
        newPath,
        archivedGrievances,
        updatedPossessions,
        rootMerkleHash,
        byteZeroVerified,
        errors: [],
    }
}

export const retireCanonicalEntityAction = async (
    cpy: LogisticModel,
    bal: LogisticBit<RetireCanonicalEntityPayload>,
    ste?: State,
): Promise<LogisticModel> => {
    const dat = bal?.dat
    if (!dat) return cpy

    const receipt = await retireCanonicalEntity(dat)
    if (receipt.success) {
        delete cpy.characterVectors[dat.characterId]
    }

    if (bal?.slv) {
        bal.slv({
            logBit: {
                idx: bal.idx || 'retire-canonical-entity',
                val: receipt.success ? 1 : -1,
                dat: receipt,
            },
        })
    }
    return cpy
}
