import * as fs from 'node:fs'
import * as path from 'node:path'
import { createHash, randomUUID } from 'node:crypto'
import * as yaml from 'js-yaml'
import { CharacterFrontmatterSchema } from '../../26.schema.unit/val/characterFrontmatter.val.js'
import {
    SeedProtagonistConfigBit,
    SeedProtagonistResultBit,
} from '../fce/seedProtagonist.bit.js'
import CharacterBit from '../fce/character.bit.js'
import { CharacterModel } from '../character.model.js'
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
 * Generates the raw Byte-0 markdown string and metadata for the seed protagonist.
 */
export function buildSeedProtagonistDossier(config: SeedProtagonistConfigBit): {
    characterId: string
    markdownContent: string
} {
    const characterId = config.characterId || 'char_protagonist'
    const characterName = config.characterName || 'Kaelen'
    const founderTokenItemId =
        config.heldItemId || config.founderTokenItemId || 'item_founder_token'
    const locationId = config.locationId || undefined
    const availableArmsBps = config.availableArmsBps || 20000

    const frontmatterData: any = {
        id: characterId,
        name: characterName,
        type: 'character',
        status: 'active',
        somatic: {
            locomotion_baseline: 'bipedal_hunched',
            available_arms_bps: availableArmsBps,
            banned_kinetic_verbs: ['leap', 'sprint', 'vault'],
            conditions: [],
            motor_limitations: ['UNSTEADY_GAIT'],
            signature_tics: [
                'turns the steel token end-over-end in his palm when challenged',
            ],
            sensory: {
                optical_state: 'NORMAL',
                blind_cone_degrees: 0,
                auditory_floor_debuff_cdb: 0,
            },
            vocal_dsp: {
                pitch_shift_centitones: 0,
                speed_multiplier_bps: 10000,
                pause_frequency_bps: 10000,
            },
        },
        logistical: {
            worn: [],
            held: [founderTokenItemId],
            carried: [],
            cached: {},
        },
        epistemic: {
            escalation_ceiling: 4,
            strings_held_over: [],
            leverage_strings: {},
            relationship_defaults: {},
            attenuation_tokens: [],
        },
        refusal_vectors: [
            {
                refusal_id: 'ref_protagonist_token_custody',
                trigger: 'Ordered to surrender the founder token',
                mandatory_refusal: 'Refuses to unclench left fist',
                unavoidable_cost: 'Takes blunt strike to ribs',
                strain_threshold_bps: 8000,
                post_break_state:
                    'Drops token and retreats into drainage conduit',
            },
        ],
        comedic_register: 'deadpan',
        pending_showrunner_task: null,
        emotion_visual_mapping: {},
        created_at_epoch: 0,
        ...(locationId ? { staged_location_id: locationId } : {}),
        inventory: {
            held_primary: founderTokenItemId,
        },
    }

    // Compile-Time Invariant Check (T0 = $0.00)
    CharacterFrontmatterSchema.parse(frontmatterData)

    // Hand Saturation SAT Check
    const heldItemsCount = frontmatterData.logistical.held.length
    const availableArms = frontmatterData.somatic.available_arms_bps / 10000
    if (heldItemsCount > availableArms) {
        throw new Error(
            `[HAND_CAPACITY_SAT_VIOLATION]: Held items (${heldItemsCount}) exceed available arms (${availableArms})`,
        )
    }

    const yamlString = yaml.dump(frontmatterData, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false,
    })

    const surfaceWant =
        config.surfaceWant ||
        'Secure the drainage conduit boundary before the water level rises.'
    const actualWant =
        config.actualWant ||
        'Maintain possession of the founder token to prove legitimate tenure in the culvert.'
    const blindSpot =
        config.blindSpot ||
        'Believes the rust line on the culvert wall indicates safety rather than impending structural failure.'
    const voiceNotes =
        config.voiceNotes ||
        'Flat delivery, laconic sentences, pauses before answering questions regarding ownership.'
    const fewShotLines = config.fewShotLines || [
        'The chalk mark is thirty paces back. You know where you stand.',
        'Token stays in the pocket until the tally clears.',
    ]

    const fewShotFormatted = fewShotLines.map((line) => `- ${line}`).join('\n')

    // Enforce Byte-0 Opening Law strictly (--- at index 0)
    const markdownContent =
        `---\n${yamlString}---\n\n` +
        `## Wants (surface)\n${surfaceWant}\n\n` +
        `## Wants (actual)\n${actualWant}\n\n` +
        `## Blind spot\n${blindSpot}\n\n` +
        `## Voice notes\n${voiceNotes}\n\n` +
        `## Few-shot lines\n${fewShotFormatted}\n`

    return { characterId, markdownContent }
}

/**
 * Persists the seed protagonist dossier atomically to the series directory.
 */
export function generateSeedProtagonistDossier(
    config: SeedProtagonistConfigBit,
    customRoot?: string,
): SeedProtagonistResultBit {
    if (!config.seriesSlug || config.seriesSlug.trim().length === 0) {
        throw new Error(
            '[GENESIS_FAIL]: seriesSlug is required to generate seed protagonist.',
        )
    }

    const root = customRoot || resolveRepoRoot()
    const charactersDir = path.join(
        root,
        'series',
        config.seriesSlug,
        'characters',
    )

    if (!fs.existsSync(charactersDir)) {
        fs.mkdirSync(charactersDir, { recursive: true })
    }

    const { characterId, markdownContent } = buildSeedProtagonistDossier(config)
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
 * Buzzer action integrating seed protagonist generation with the state machine.
 */
export const generateSeedProtagonist = (
    cpy: CharacterModel,
    bal: CharacterBit,
    ste: State,
): CharacterModel => {
    try {
        const config: SeedProtagonistConfigBit = bal.dat || {
            seriesSlug: bal.src || 'default-series',
        }
        const result = generateSeedProtagonistDossier(config)

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

export const seedCoreCharacters = (
    cpy: CharacterModel,
    bal: CharacterBit,
    ste: State,
): CharacterModel => {
    const seriesSlug = bal.src || 'default-series'
    try {
        const charId = 'char_protagonist'
        const result = generateSeedProtagonistDossier({
            seriesSlug,
            characterId: charId,
        })
        if (bal.slv) {
            bal.slv({
                characterBit: {
                    idx: bal.idx,
                    val: 1,
                    dat: result,
                },
            })
        }

        ste.hunt('[Console action] Update Console', {
            idx: 'cns00',
            src: `============================================================\n>> [GENESIS:PROTAGONIST] Bootstrapping seed actor: char_protagonist\n>> [BYTE-0 CHECK] Verified preamble offset: 0x2D2D2D0A [OK]\n>> [SOMATIC] Baseline: bipedal_hunched | Arms: 20000 bps (2.0)\n>> [SAT GATE] Hand Saturation Check: 10000 <= 20000 bps [PASS]\n>> [ATOMIC WRITE] series/${seriesSlug}/characters/char_protagonist.md\n>> [STATUS] SHA-256 Digest: ${result.contentSha256.substring(0, 8)}... [SEALED AT T0 = $0.00]\n============================================================`,
        })
    } catch (err: any) {
        if (bal.slv) {
            bal.slv({
                characterBit: {
                    idx: bal.idx,
                    val: 0,
                    dat: { error: err.message },
                },
            })
        }
    }
    return cpy
}
