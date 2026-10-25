/**
 * packages/299.lore/15.item.unit/buz/itemScaffold.buzz.ts
 * Interactive Possession Scaffolding Interview State Machine.
 * Sequences Blessed TUI modals, validates weight-class mass consistency,
 * and serializes Byte-0 Dual-Rail Markdown possession dossiers.
 * Strictly 7-bit ASCII. Zero emojis.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { ItemModel } from '../item.model.js'
import type ItemScaffoldBit from '../fce/itemScaffold.bit.js'
import type { ItemScaffoldResult } from '../fce/itemScaffold.bit.js'
import type State from '../../99.core/state.js'

const UPDATE_CONSOLE = '[Console action] Update Console'
const UPDATE_GRID = '[Grid action] Update Grid'
const OPEN_CHOICE = '[Open action] Open Choice'
const OPEN_INPUT = '[Open action] Open Input'

export interface WeightClassPreset {
    label: string
    classKey: 'scrap' | 'shine' | 'weight' | 'bulk'
    minGrams: number
    maxGrams: number
    defaultGrams: number
}

export const WEIGHT_CLASS_PRESETS: Record<string, WeightClassPreset> = {
    SCRAP: {
        label: 'SCRAP (1 - 50g, Pocket Flotsam)',
        classKey: 'scrap',
        minGrams: 1,
        maxGrams: 50,
        defaultGrams: 20,
    },
    SHINE: {
        label: 'SHINE (51 - 250g, Cultural Tokens & Small Relics)',
        classKey: 'shine',
        minGrams: 51,
        maxGrams: 250,
        defaultGrams: 120,
    },
    WEIGHT: {
        label: 'WEIGHT (251 - 5000g, Tools, Levers, Weapons)',
        classKey: 'weight',
        minGrams: 251,
        maxGrams: 5000,
        defaultGrams: 850,
    },
    BULK: {
        label: 'BULK (> 5000g, Sacks, Machinery, Ballast)',
        classKey: 'bulk',
        minGrams: 5001,
        maxGrams: 500000,
        defaultGrams: 8000,
    },
}

export const EQUIP_SLOT_PRESETS = [
    'held_primary',
    'held_offhand',
    'worn_inner',
    'worn_outer',
    'worn_belt',
    'carried',
    'cached',
    'floor',
]

export const HAND_OCCUPANCY_PRESETS: Record<string, number> = {
    '0 HANDS (Worn, Cached, Slung - 0 bps)': 0,
    '1 HAND (Standard Tool / Weapon - 10,000 bps)': 10000,
    '2 HANDS (Heavy Bimanual Lift - 20,000 bps)': 20000,
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
 * Validates and derives consistent weight class from integer gram mass.
 */
export function resolveWeightClass(
    massGrams: number,
): 'scrap' | 'shine' | 'weight' | 'bulk' {
    if (massGrams <= 50) return 'scrap'
    if (massGrams <= 250) return 'shine'
    if (massGrams <= 5000) return 'weight'
    return 'bulk'
}

/**
 * Formats possession dossier Markdown strictly adhering to Byte-0 YAML delimiter law.
 */
export function renderPossessionDossierMarkdown(data: {
    id: string
    name: string
    massGrams: number
    weightClass: 'scrap' | 'shine' | 'weight' | 'bulk'
    equipSlot: string
    occupiesHandsBps: number
    custodyHolder?: string
    isContested: boolean
}): string {
    const yamlLines = [
        '---',
        `id: ${data.id}`,
        `name: "${data.name}"`,
        'type: possession',
        'status: active',
        'logistical:',
        `  mass_grams: ${data.massGrams}`,
        `  weight_class: ${data.weightClass}`,
        `  equip_slot: ${data.equipSlot}`,
        `  occupies_hands_bps: ${data.occupiesHandsBps}`,
        `  is_contested: ${data.isContested}`,
        data.custodyHolder
            ? `  custody_holder: ${data.custodyHolder}`
            : '  custody_holder: null',
        'linked_grievances: []',
        '---',
        '',
        '## Physical Condition',
        'Slightly tarnished and scratched scrap metal with chipped edges from prying tool work.',
        '',
        '## Provenance & Salvage History',
        'Salvaged from the crawlspace floorboards during the late-season dry cycle.',
        '',
    ]

    return yamlLines.join('\n')
}

/**
 * Writes dossier string atomically via .tmp scratch file and verifies Byte-0 offset.
 */
export function writePossessionDossierAtomic(
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
 * Master Possession Scaffolding Interview Wizard Buzzer.
 */
export const scaffoldPossessionWizard = async (
    cpy: ItemModel,
    bal: ItemScaffoldBit,
    ste: State,
): Promise<ItemModel> => {
    const isHeadless = !(globalThis as any).LIBRARY && !ste?.hunt
    const rootDir = resolveRepoRoot()
    const seriesSlug = bal.dat?.seriesSlug || 'under-the-floorboards'
    const possessionsDir = path.join(
        rootDir,
        'series',
        seriesSlug,
        'possessions',
    )

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [SCAFFOLD:ITEM] Initializing Tracked Possession Interview...',
    })

    // Step 1: Item Slug & Name Input
    let itemId = bal.dat?.itemId
    let itemName = bal.dat?.name

    if (!itemId && !isHeadless) {
        await ste.hunt(UPDATE_GRID, { x: 0, y: 4, xSpan: 4, ySpan: 6 })
        const idBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Item ID (e.g. item_iron_knife):',
            dat: { val: 'item_' },
        })
        itemId = idBit?.putBit?.src?.trim()
    }

    if (!itemId || !/^item_[a-z0-9_]+$/.test(itemId)) {
        itemId = itemId || 'item_new_prop'
        if (!/^item_[a-z0-9_]+$/.test(itemId)) {
            itemId = `item_${itemId.replace(/[^a-z0-9_]/g, '_')}`
        }
    }

    if (!itemName && !isHeadless) {
        const nameBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Display Name (e.g. Iron Trench Knife):',
            dat: { val: 'Tool' },
        })
        itemName = nameBit?.putBit?.src?.trim() || 'Tool'
    } else {
        itemName = itemName || 'Tool'
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [IDENTITY] Bound: ${itemId} ("${itemName}")`,
    })

    // Step 2: Mass Grams & Weight Class
    let massGrams = bal.dat?.massGrams
    let weightClass = bal.dat?.weightClass

    if (!weightClass && !isHeadless) {
        await ste.hunt(UPDATE_GRID, { x: 0, y: 4, xSpan: 4, ySpan: 8 })
        const classBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'cyan' },
            src: 'vertical',
            lst: Object.keys(WEIGHT_CLASS_PRESETS),
        })
        const selectedKey = classBit?.chcBit?.src || 'SCRAP'
        const preset =
            WEIGHT_CLASS_PRESETS[selectedKey] || WEIGHT_CLASS_PRESETS.SCRAP
        weightClass = preset.classKey
        if (!massGrams) massGrams = preset.defaultGrams
    }

    if (!massGrams && !isHeadless) {
        const massInputBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Mass in Grams (e.g. 120):',
            dat: { val: '50' },
        })
        const parsed = parseInt(massInputBit?.putBit?.src?.trim(), 10)
        massGrams = !isNaN(parsed) && parsed > 0 ? parsed : 50
    } else {
        massGrams = massGrams && massGrams > 0 ? massGrams : 50
    }

    // Derive weightClass if not explicitly set
    if (!weightClass) {
        weightClass = resolveWeightClass(massGrams)
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [LOGISTICS] Mass: ${massGrams}g | Weight Tier: ${weightClass.toUpperCase()}`,
    })

    // Step 3: Equip Slot & Hand Demand
    let equipSlot = bal.dat?.equipSlot || 'held_primary'
    let occupiesHandsBps = bal.dat?.occupiesHandsBps

    if (!bal.dat?.equipSlot && !isHeadless) {
        const slotBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'yellow' },
            src: 'vertical',
            lst: EQUIP_SLOT_PRESETS,
        })
        equipSlot = slotBit?.chcBit?.src || 'held_primary'
    }

    if (occupiesHandsBps === undefined && !isHeadless) {
        const handBit: any = await ste.hunt(OPEN_CHOICE, {
            dat: { clr0: 'black', clr1: 'cyan' },
            src: 'vertical',
            lst: Object.keys(HAND_OCCUPANCY_PRESETS),
        })
        const key =
            handBit?.chcBit?.src ||
            '1 HAND (Standard Tool / Weapon - 10,000 bps)'
        occupiesHandsBps = HAND_OCCUPANCY_PRESETS[key] ?? 10000
    } else if (occupiesHandsBps === undefined) {
        occupiesHandsBps = equipSlot.startsWith('held') ? 10000 : 0
    }

    // Enforce hand consistency: worn/cached cannot occupy hands
    if (!equipSlot.startsWith('held') && occupiesHandsBps > 0) {
        occupiesHandsBps = 0
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [REPAIR] Hand demand clamped to 0 bps for non-held slot '${equipSlot}'.`,
        })
    }

    await ste.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [SLOT] Equip Slot: ${equipSlot} | Occupies: ${occupiesHandsBps} bps`,
    })

    // Step 4: Custody Holder & Contested Status
    let custodyHolder = bal.dat?.custodyHolder
    const isContested = bal.dat?.isContested !== false

    if (custodyHolder === undefined && !isHeadless) {
        const ownerBit: any = await ste.hunt(OPEN_INPUT, {
            src: 'Enter Initial Custody (Character ID or UNOWNED):',
            dat: { val: 'UNOWNED' },
        })
        const rawVal = ownerBit?.putBit?.src?.trim()
        custodyHolder = rawVal && rawVal !== 'UNOWNED' ? rawVal : undefined
    }

    if (custodyHolder) {
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [CUSTODY] Holder: ${custodyHolder} (Contested: ${isContested})`,
        })
    } else {
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> [CUSTODY] Holder: UNOWNED / STAGED ON FLOOR',
        })
    }

    // Step 5: Render Dossier & Atomic POSIX Write
    const destPath = path.join(possessionsDir, `${itemId}.md`)
    const dossierMarkdown = renderPossessionDossierMarkdown({
        id: itemId,
        name: itemName,
        massGrams,
        weightClass,
        equipSlot,
        occupiesHandsBps,
        custodyHolder,
        isContested,
    })

    try {
        writePossessionDossierAtomic(destPath, dossierMarkdown)
        await ste.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [SEALED] Possession '${itemId}' written to disk at Byte 0 [OK]`,
        })

        const res: ItemScaffoldResult = {
            success: true,
            filePath: destPath,
            itemId,
            weightClass,
            occupiesHandsBps,
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
