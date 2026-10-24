/**
 * packages/299.lore/01.location.unit/buz/locationScaffold.buzz.ts
 * Interactive Location Scaffolding Interview State Machine.
 * Sequences Blessed TUI modals, reconciles reciprocal topological edges,
 * and serializes Byte-0 Dual-Rail Markdown location dossiers.
 * Strictly 7-bit ASCII. Zero emojis.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { LocationModel } from '../location.model.js'
import type LocationScaffoldBit from '../fce/locationScaffold.bit.js'
import type { LocationScaffoldResult } from '../fce/locationScaffold.bit.js'
import type State from '../../99.core/state.js'

const UPDATE_CONSOLE = '[Console action] Update Console'
const UPDATE_GRID = '[Grid action] Update Grid'
const OPEN_CHOICE = '[Open action] Open Choice'
const OPEN_INPUT = '[Open action] Open Input'

export interface AcousticPreset {
    label: string
    dampingCdB: number
}

export const ACOUSTIC_PRESETS: Record<string, AcousticPreset> = {
    THIN_LATH_PARTITION: {
        label: 'THIN_LATH_PARTITION (1200 cdB)',
        dampingCdB: 1200,
    },
    TIMBER_SUBFLOOR: { label: 'TIMBER_SUBFLOOR (2500 cdB)', dampingCdB: 2500 },
    CONCRETE_MASONRY: {
        label: 'CONCRETE_MASONRY (4500 cdB)',
        dampingCdB: 4500,
    },
    HEAVY_IRON_BULKHEAD: {
        label: 'HEAVY_IRON_BULKHEAD (8000 cdB)',
        dampingCdB: 8000,
    },
}

export interface NoiseFloorPreset {
    label: string
    noiseCdB: number
}

export const NOISE_FLOOR_PRESETS: Record<string, NoiseFloorPreset> = {
    DEAD_SILENCE: { label: 'DEAD_SILENCE (20 cdB)', noiseCdB: 20 },
    STEAM_SEEPAGE: { label: 'STEAM_SEEPAGE (45 cdB)', noiseCdB: 45 },
    CULVERT_RUNOFF: { label: 'CULVERT_RUNOFF (60 cdB)', noiseCdB: 60 },
    HEAVY_PUMP_MACHINERY: {
        label: 'HEAVY_PUMP_MACHINERY (75 cdB)',
        noiseCdB: 75,
    },
}

/**
 * Resolves repository root by walking upward from current working directory.
 */
export function resolveRepoRoot(): string {
    let curr = process.cwd()
    for (let i = 0; i < 6; i++) {
        if (
            fs.existsSync(path.join(curr, 'series')) ||
            fs.existsSync(path.join(curr, 'packages'))
        ) {
            return curr
        }
        const parent = path.dirname(curr)
        if (parent === curr) break
        curr = parent
    }
    return process.cwd()
}

/**
 * Formats location dossier Markdown strictly adhering to Byte-0 YAML delimiter law.
 */
export function renderLocationDossierMarkdown(data: {
    id: string
    name: string
    maxAdultGoblins: number
    acousticDampingCdB: number
    ambientNoiseCdB: number
    volumeProfile: string
    connectedLocations: string[]
}): string {
    const yamlLines = [
        '---',
        `id: ${data.id}`,
        `name: "${data.name}"`,
        'type: location',
        'status: active',
        'spatial:',
        `  max_adult_goblins: ${data.maxAdultGoblins}`,
        `  volume_profile: ${data.volumeProfile}`,
        `  acoustic_damping_cdb: ${data.acousticDampingCdB}`,
        `  ambient_noise_cdb: ${data.ambientNoiseCdB}`,
        '  dynamic_occluders: []',
        'connected_locations:',
        ...(data.connectedLocations.length > 0
            ? data.connectedLocations.map((loc) => `  - ${loc}`)
            : ['  - none']),
        'linked_grievances: []',
        'linked_possessions: []',
        '---',
        '',
        '## Tactical Geometry & Hex Grid',
        'Enclosed tactical hex mesh. Axial bounds constrained by exterior joist bulkheads.',
        '',
        '## Sensory Atmosphere & Lighting',
        '- **Dominant Lighting:** Dim amber sodium seepage through subfloor cracks.',
        '- **Tactile Surface:** Dry splintered lath joists covered in fine gypsum powder.',
        '- **Acoustic Profile:** Heavy thermal pipe expansion ticks occurring periodically.',
        '',
    ]

    return yamlLines.join('\n')
}

/**
 * Writes dossier string atomically via .tmp scratch file and verifies Byte-0 offset.
 */
export function writeLocationDossierAtomic(
    targetPath: string,
    content: string,
): void {
    const dir = path.dirname(targetPath)
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    const tmpPath = `${targetPath}.tmp_${Date.now()}`
    fs.writeFileSync(tmpPath, content, 'utf8')

    // Verify Byte 0 invariant
    const buf = fs.readFileSync(tmpPath)
    if (
        buf.length < 3 ||
        buf[0] !== 0x2d ||
        buf[1] !== 0x2d ||
        buf[2] !== 0x2d
    ) {
        if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath)
        throw new Error(
            '[BYTE_ZERO_BREACH]: Serialized file does not begin with --- at offset 0',
        )
    }

    fs.renameSync(tmpPath, targetPath)
}

/**
 * Reconciles reciprocal spatial connections on adjacent location files.
 * Atomically appends newLocId to connected_locations while preserving Byte-0 alignment.
 */
export function reconcileReciprocalLocationLinks(
    locationsDir: string,
    newLocId: string,
    targetLocIds: string[],
): string[] {
    const reconciled: string[] = []

    for (const targetId of targetLocIds) {
        if (targetId === 'none' || targetId === newLocId) continue
        const targetFile = path.join(locationsDir, `${targetId}.md`)
        if (!fs.existsSync(targetFile)) continue

        const raw = fs.readFileSync(targetFile, 'utf8')
        if (!raw.startsWith('---')) continue

        const secondFence = raw.indexOf('\n---', 3)
        if (secondFence === -1) continue

        const frontmatter = raw.substring(0, secondFence + 4)
        const body = raw.substring(secondFence + 4)

        // Check if newLocId is already connected
        const connRegex = /connected_locations:\s*\n((?:\s*-\s*[^\n]+\n)*)/
        const match = frontmatter.match(connRegex)

        let updatedFrontmatter = frontmatter
        if (match) {
            const existingEntries = match[1]
                .split('\n')
                .map((l) => l.replace(/^\s*-\s*/, '').trim())
                .filter(Boolean)

            if (!existingEntries.includes(newLocId)) {
                const filtered = existingEntries.filter((e) => e !== 'none')
                filtered.push(newLocId)
                const newBlock = `connected_locations:\n${filtered.map((e) => `  - ${e}`).join('\n')}\n`
                updatedFrontmatter = frontmatter.replace(connRegex, newBlock)
            }
        } else {
            updatedFrontmatter = frontmatter.replace(
                '---',
                `connected_locations:\n  - ${newLocId}\n---`,
            )
        }

        if (updatedFrontmatter !== frontmatter) {
            writeLocationDossierAtomic(targetFile, updatedFrontmatter + body)
            reconciled.push(targetId)
        }
    }

    return reconciled
}

/**
 * Master Location Scaffolding Interview Wizard Buzzer.
 */
export const scaffoldLocationWizard = async (
    cpy: LocationModel,
    bal: LocationScaffoldBit,
    ste: State,
): Promise<LocationModel> => {
    const isHeadless = !(globalThis as any).LIBRARY && !ste?.hunt
    const rootDir = resolveRepoRoot()
    const seriesSlug = bal.dat?.seriesSlug || 'under-the-floorboards'
    const locationsDir = path.join(rootDir, 'series', seriesSlug, 'locations')

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [SCAFFOLD:LOC] Initializing Location Vector Interview...',
    })

    // Step 1: Location Slug & Name Input
    let locId = bal.dat?.locId
    let locName = bal.dat?.name

    if (!locId && !isHeadless) {
        await ste.hunt(UPDATE_GRID, { x: 0, y: 4, xSpan: 4, ySpan: 6 })
        const idBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Location ID (e.g. loc_culvert_basin):',
            dat: { val: 'loc_' },
        })
        locId = idBit?.putBit?.src?.trim()
    }

    if (!locId || !/^loc_[a-z0-9_]+$/.test(locId)) {
        locId = locId || 'loc_new_chamber'
        if (!/^loc_[a-z0-9_]+$/.test(locId)) {
            locId = `loc_${locId.replace(/[^a-z0-9_]/g, '_')}`
        }
    }

    if (!locName && !isHeadless) {
        const nameBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Display Name (e.g. The Culvert Basin):',
            dat: { val: 'Chamber' },
        })
        locName = nameBit?.putBit?.src?.trim() || 'Chamber'
    } else {
        locName = locName || 'Chamber'
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [IDENTITY] Bound: ${locId} ("${locName}")`,
    })

    // Step 2: Capacity Ceiling & Volume Profile
    let maxAdultGoblins = bal.dat?.maxAdultGoblins || 2
    let volumeProfile = bal.dat?.volumeProfile || 'CRAMPED_CHOKE'

    if (!bal.dat?.volumeProfile && !isHeadless) {
        await ste.hunt(UPDATE_GRID, { x: 0, y: 4, xSpan: 4, ySpan: 8 })
        const volBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'cyan' },
            src: 'vertical',
            lst: [
                'CRAMPED_CHOKE',
                'MODERATE_CHAMBER',
                'EXPOSED_BASIN',
                'VERTICAL_SHAFT',
            ],
        })
        volumeProfile = volBit?.chcBit?.src || 'CRAMPED_CHOKE'
    }

    if (!bal.dat?.maxAdultGoblins && !isHeadless) {
        const capBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'yellow' },
            src: 'vertical',
            lst: [
                '1 Adult Goblin (Strict Squeeze)',
                '2 Adult Goblins (Standard Pairing)',
                '4 Adult Goblins (Crowded)',
                '8 Adult Goblins (Open Commons)',
            ],
        })
        const selectedCap = capBit?.chcBit?.src || ''
        if (selectedCap.startsWith('1')) maxAdultGoblins = 1
        else if (selectedCap.startsWith('2')) maxAdultGoblins = 2
        else if (selectedCap.startsWith('4')) maxAdultGoblins = 4
        else if (selectedCap.startsWith('8')) maxAdultGoblins = 8
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [VOLUME] Profile: ${volumeProfile} | Max Occupancy: ${maxAdultGoblins}`,
    })

    // Step 3: Acoustic Damping & Noise Floor
    let dampingCdB = bal.dat?.acousticDampingCdB || 1500
    let noiseCdB = bal.dat?.ambientNoiseCdB || 45

    if (!bal.dat?.acousticDampingCdB && !isHeadless) {
        const dampBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'yellow' },
            src: 'vertical',
            lst: Object.keys(ACOUSTIC_PRESETS),
        })
        const key = dampBit?.chcBit?.src || 'THIN_LATH_PARTITION'
        dampingCdB = ACOUSTIC_PRESETS[key]?.dampingCdB || 1500
    }

    if (!bal.dat?.ambientNoiseCdB && !isHeadless) {
        const noiseBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'cyan' },
            src: 'vertical',
            lst: Object.keys(NOISE_FLOOR_PRESETS),
        })
        const key = noiseBit?.chcBit?.src || 'STEAM_SEEPAGE'
        noiseCdB = NOISE_FLOOR_PRESETS[key]?.noiseCdB || 45
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [ACOUSTICS] Damping: ${dampingCdB} cdB | Noise Floor: ${noiseCdB} cdB`,
    })

    // Step 4: Topological Adjacency & Reciprocal Linking
    let connectedLocations = bal.dat?.connectedLocations || []
    const shouldReconcile = bal.dat?.reconcileReciprocalLinks !== false

    const destPath = path.join(locationsDir, `${locId}.md`)
    const dossierMarkdown = renderLocationDossierMarkdown({
        id: locId,
        name: locName,
        maxAdultGoblins,
        acousticDampingCdB: dampingCdB,
        ambientNoiseCdB: noiseCdB,
        volumeProfile,
        connectedLocations,
    })

    try {
        writeLocationDossierAtomic(destPath, dossierMarkdown)
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [SEALED] Location '${locId}' written to disk at Byte 0 [OK]`,
        })

        let reconciledTargets: string[] = []
        if (shouldReconcile && connectedLocations.length > 0) {
            reconciledTargets = reconcileReciprocalLocationLinks(
                locationsDir,
                locId,
                connectedLocations,
            )
            for (const rec of reconciledTargets) {
                await ste.hunt(UPDATE_CONSOLE, {
                    idx: 'cns00',
                    src: `>> [RECIPROCAL] Appended ${locId} to ${rec}.md [OK]`,
                })
            }
        }

        const res: LocationScaffoldResult = {
            success: true,
            filePath: destPath,
            locId,
            reconciledTargets,
        }
        if (bal.slv) bal.slv(res)
    } catch (err: any) {
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `:: [ERROR] Write failure: ${err.message}`,
        })
        if (bal.slv) bal.slv({ success: false, error: err.message })
    }

    return cpy
}
