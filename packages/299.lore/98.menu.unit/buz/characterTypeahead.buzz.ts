import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export interface CatalogItemInfo {
    readonly id: string
    readonly name: string
    readonly handsRequiredBps: number
    readonly massGrams: number
    readonly slotCategory: 'worn' | 'held' | 'carried' | 'cached'
}

export interface EquipmentSlotSelectionResult {
    readonly worn: readonly string[]
    readonly held: readonly string[]
    readonly carried: readonly string[]
    readonly cached: Record<string, readonly string[]>
    readonly cancelled: boolean
}

/**
 * Sweeps series/<slug>/possessions/*.md on local disk to discover existing gear.
 */
export function loadSeriesPossessionsCatalog(
    seriesSlug: string,
): CatalogItemInfo[] {
    const repoRoot = resolveRepoRoot()
    const dir = path.resolve(repoRoot, 'series', seriesSlug, 'possessions')
    if (!fs.existsSync(dir)) return []

    const files = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.md') && !f.startsWith('_'))
    const catalog: CatalogItemInfo[] = []

    for (const file of files) {
        try {
            const raw = fs.readFileSync(path.join(dir, file), 'utf-8')
            const { data } = matter(raw)
            if (data?.id && data?.name) {
                catalog.push({
                    id: data.id,
                    name: data.name,
                    handsRequiredBps:
                        typeof data.hands_required_bps === 'number'
                            ? data.hands_required_bps
                            : 10000,
                    massGrams:
                        typeof data.mass_grams === 'number'
                            ? data.mass_grams
                            : 200,
                    slotCategory: data.slot_category || 'held',
                })
            }
        } catch {}
    }

    return catalog
}

export const promptEquipmentSlots = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: any,
): Promise<EquipmentSlotSelectionResult> => {
    const lib = (globalThis as any).LIBRARY

    // Headless bypass for CI & Vitest
    if (!lib || typeof lib.hunt !== 'function') {
        const headlessFallback: EquipmentSlotSelectionResult = {
            worn: [],
            held: [],
            carried: [],
            cached: {},
            cancelled: false,
        }
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'equipment-typeahead-headless',
                    dat: headlessFallback,
                },
            })
        }
        return headlessFallback
    }

    const activeSlug =
        bal?.src || (cpy as any).activeSeriesSlug || 'under-the-floorboards'
    const availableArmsBps =
        typeof bal?.dat?.availableArmsBps === 'number'
            ? bal.dat.availableArmsBps
            : 20000
    const catalog = loadSeriesPossessionsCatalog(activeSlug)

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [CHAR WIZARD: STEP 4] Configuring Equipment Slots for series [${activeSlug}]...`,
    })

    const worn: string[] = []
    const held: string[] = []
    const carried: string[] = []
    const cached: Record<string, string[]> = {}

    // Interactive selection for HELD primary slot
    const heldChoices = catalog.map((item) => {
        const disabled = item.handsRequiredBps > availableArmsBps
        const tag = disabled ? ' [DISABLED: EXCEEDS_ARM_CAPACITY]' : ''
        return `${item.id} (${item.name} | ${item.handsRequiredBps.toLocaleString()} bps hands)${tag}`
    })

    if (heldChoices.length === 0) {
        heldChoices.push('[NONE AVAILABLE (EMPTY)]')
    }
    heldChoices.push('[EMPTY HAND / NONE]')
    heldChoices.push('CANCEL')

    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 11,
    })

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: '>> [SLOT SELECTION] Choose item for HELD slot:',
    })

    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: { clr0: 'black', clr1: 'cyan' },
        src: 'vertical',
        lst: heldChoices,
        net: gridBit?.grdBit?.dat,
    })

    const selection: string | undefined = choiceBit?.chcBit?.src

    if (!selection || selection === 'CANCEL') {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> [SLOT SELECTION] Equipment allocation aborted by operator.',
        })
        const cancelResult: EquipmentSlotSelectionResult = {
            worn: [],
            held: [],
            carried: [],
            cached: {},
            cancelled: true,
        }
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'equipment-typeahead-cancelled',
                    dat: cancelResult,
                },
            })
        }
        return cancelResult
    }

    if (
        selection !== '[EMPTY HAND / NONE]' &&
        selection !== '[NONE AVAILABLE (EMPTY)]'
    ) {
        if (selection.includes('[DISABLED: EXCEEDS_ARM_CAPACITY]')) {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: ':: [BREACH:HALT] HAND_CAPACITY_BREACH: Entity cannot hold two-handed tool with degraded limbs!',
            })
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `:: Demanded: 20,000 bps | Available: ${availableArmsBps.toLocaleString()} bps. Allocation rejected.`,
            })
            held.length = 0
        } else {
            const itemId = selection.split(' ')[0].trim()
            held.push(itemId)
        }
    }

    // Evaluate Hand Capacity Invariant SAT
    let demandedArmsBps = 0
    for (const hId of held) {
        const it = catalog.find((i) => i.id === hId)
        if (it) demandedArmsBps += it.handsRequiredBps
    }

    const satPassed = demandedArmsBps <= availableArmsBps

    if (satPassed) {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [GEAR:RESOLVE] Loadout verified: ${held.length} item(s) allocated to hands.`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: `>> [SAT GATE] Held: ${demandedArmsBps.toLocaleString()} bps <= Arms: ${availableArmsBps.toLocaleString()} bps [PASS / T0 = $0.00]`,
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> [STATUS] Hand Capacity Invariant Satisfied [OK]',
        })
    } else {
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: ':: [BREACH:HALT] HAND_CAPACITY_BREACH: Hand Saturation SAT Failed! Reverting held slots to empty.',
        })
        held.length = 0
    }

    const result: EquipmentSlotSelectionResult = {
        worn,
        held,
        carried,
        cached,
        cancelled: false,
    }

    if (bal?.slv) {
        bal.slv({
            mnuBit: { idx: 'equipment-typeahead-selected', dat: result },
        })
    }

    return result
}
