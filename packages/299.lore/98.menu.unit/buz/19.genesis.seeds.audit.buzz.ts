/**
 * packages/299.lore/98.menu.unit/buz/19.genesis.seeds.audit.buzz.ts
 *
 * Series genesis seed population audit buzzer. Exercises the REAL
 * 27.seed.unit populateGenesisSeeds gauntlet inside a hermetic temporary
 * repository: world conditions + economy dossiers, origin hub location,
 * byte-0 preamble verification on every emitted buffer, plus fail-closed
 * negative probes (BOM poison, leading whitespace, missing series
 * directory). Streams pure 7-bit ASCII telemetry into the cns00 Blessed
 * console pane. Never touches the live repo tree.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { populateGenesisSeeds } from '../../27.seed.unit/buz/populateGenesisSeeds.buzz.js'
import { verifyByteZeroBuffer } from '../../27.seed.unit/buz/seedWorldDefinitions.buzz.js'
import { SeedModel } from '../../27.seed.unit/seed.model.js'

export const GENESIS_SEEDS_MENU_LABEL = '[ 7. POPULATE GENESIS SEEDS ]'

export const GENESIS_SEEDS_AUDIT_HEADER =
    '--- [299.LORE :: 27.SEED.UNIT :: SERIES GENESIS SEED POPULATION] ---'

export const GENESIS_SEEDS_INIT_LINE =
    '>> [SEED:INIT] Loading series directory for genesis seed emission...'

export const GENESIS_SEEDS_CONDITIONS_LINE =
    '>> [SEED] World definition seeded: world_conditions_registry'

export const GENESIS_SEEDS_ECONOMY_LINE =
    '>> [SEED] World definition seeded: world_economy_registry'

export const GENESIS_SEEDS_HUB_LINE =
    '>> [SEED] Location seeded: loc_origin_hub'

export const GENESIS_SEEDS_BYTE_ZERO_LINE =
    '>> [BYTE-0] Byte-0 preamble verified across all 3 seed dossiers.'

export const GENESIS_SEEDS_SEALED_FOOTER =
    '--- [AUDIT COMPLETE: GENESIS SEED DOSSIERS SEALED AT T0 = $0.00] ---'

const PROBE_SLUG = 'audit-genesis-probe'

const EXPECTED_SEED_IDS = [
    'world_conditions_registry',
    'world_economy_registry',
    'world_chronology',
    'world_dramatic_catalysts',
    'loc_origin_hub',
]

export interface GenesisSeedsAudit {
    initSealed: boolean
    triadSealed: boolean
    byteZeroSealed: boolean
    probesTrapped: number
    probeTotal: number
    valid: boolean
    errors: string[]
}

/**
 * Runs the REAL Phase 6 seed gauntlet against the live populateGenesisSeeds
 * buzzer inside a hermetic temp repo root. Verifies the seeded triad,
 * byte-0 preambles, and fail-closed negative probes. Never throws;
 * reports breaches via errors. Always removes the temp repo.
 */
export async function auditGenesisSeeds(): Promise<GenesisSeedsAudit> {
    const errors: string[] = []
    let initSealed = false
    let triadSealed = false
    let byteZeroSealed = false
    let probesTrapped = 0

    const tempRepo = fs.mkdtempSync(
        path.join(os.tmpdir(), 'goblin-genesis-seeds-audit-'),
    )
    try {
        const seriesBase = path.join(tempRepo, 'series', PROBE_SLUG)
        fs.mkdirSync(seriesBase, { recursive: true })

        // [SEED:INIT] Real population must return val: 1 with 5 dossiers.
        const model = new SeedModel()
        let result: any = null
        await populateGenesisSeeds(model, {
            idx: 'genesis-seeds-audit',
            dat: { seriesSlug: PROBE_SLUG, repoRoot: tempRepo },
            slv: (res: any) => {
                result = res
            },
        } as any)

        initSealed =
            result?.seedBit?.val === 1 &&
            result?.seedBit?.dat?.totalSeeded === 5
        if (!initSealed) {
            errors.push(
                '[SEED:BREACH] populateGenesisSeeds failed val: 1 with 5 dossiers.',
            )
        }

        // Triad: exact dossier ids, files on disk.
        const seededIds: string[] = (
            result?.seedBit?.dat?.seededFiles || []
        ).map((d: { id: string }) => d.id)
        const files = [
            path.join(seriesBase, 'world', 'conditions.md'),
            path.join(seriesBase, 'world', 'economy.md'),
            path.join(seriesBase, 'world', 'chronology.md'),
            path.join(seriesBase, 'world', 'dramatic-catalysts.md'),
            path.join(seriesBase, 'locations', 'loc_origin_hub.md'),
        ]
        triadSealed =
            EXPECTED_SEED_IDS.every((id) => seededIds.includes(id)) &&
            files.every((f) => fs.existsSync(f))
        if (!triadSealed) {
            errors.push(
                '[SEED:BREACH] genesis triad incomplete on disk or receipt.',
            )
        }

        // [BYTE-0] Every emitted dossier must open with 0x2D 0x2D 0x2D 0x0A.
        byteZeroSealed =
            files.every((f) => fs.existsSync(f)) &&
            files.every((f) => verifyByteZeroBuffer(fs.readFileSync(f)))
        if (!byteZeroSealed) {
            errors.push(
                '[SEED:BREACH] byte-0 preamble violation in emitted dossiers.',
            )
        }

        // Negative probes: BOM poison, leading space, leading newline.
        const poisonProbes: Array<[string, Buffer]> = [
            ['BOM', Buffer.from([0xef, 0xbb, 0xbf, 0x2d, 0x2d, 0x2d, 0x0a])],
            ['LEADING_SPACE', Buffer.from(' ---\nid: test\n')],
            ['LEADING_NEWLINE', Buffer.from('\n---\nid: test\n')],
        ]
        for (const [id, buf] of poisonProbes) {
            if (!verifyByteZeroBuffer(buf)) {
                probesTrapped += 1
            } else {
                errors.push(
                    `[SEED:BREACH] preamble probe ${id} escaped verifyByteZeroBuffer.`,
                )
            }
        }

        // Missing-directory probe must fail closed with val: 0.
        let missing: any = null
        await populateGenesisSeeds(model, {
            idx: 'genesis-seeds-audit-missing',
            dat: { seriesSlug: 'ghost-series-probe', repoRoot: tempRepo },
            slv: (res: any) => {
                missing = res
            },
        } as any)
        if (
            missing?.seedBit?.val === 0 &&
            String(missing?.seedBit?.dat?.error || '').includes(
                'SERIES_DIRECTORY_NOT_FOUND',
            )
        ) {
            probesTrapped += 1
        } else {
            errors.push(
                '[SEED:BREACH] missing-directory probe escaped without SERIES_DIRECTORY_NOT_FOUND.',
            )
        }
    } finally {
        fs.rmSync(tempRepo, { recursive: true, force: true })
    }

    const probeTotal = 4
    return {
        initSealed,
        triadSealed,
        byteZeroSealed,
        probesTrapped,
        probeTotal,
        valid: errors.length === 0,
        errors,
    }
}

/**
 * Streams the exact 7-bit ASCII genesis seed telemetry block on success;
 * throws a [SEED:FAILED] error on any breach.
 */
export const runGenesisSeedsAudit = async (): Promise<string[]> => {
    const audit = await auditGenesisSeeds()
    if (!audit.valid) {
        throw new Error(`[SEED:FAILED] ${audit.errors.join(' ')}`)
    }

    return [
        GENESIS_SEEDS_AUDIT_HEADER,
        GENESIS_SEEDS_INIT_LINE,
        GENESIS_SEEDS_CONDITIONS_LINE,
        GENESIS_SEEDS_ECONOMY_LINE,
        GENESIS_SEEDS_HUB_LINE,
        GENESIS_SEEDS_BYTE_ZERO_LINE,
        GENESIS_SEEDS_SEALED_FOOTER,
    ]
}
