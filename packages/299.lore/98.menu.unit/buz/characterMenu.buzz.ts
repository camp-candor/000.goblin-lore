import path from 'node:path'
import fs from 'node:fs'
import * as ActMnu from '../menu.action.js'
import * as ActLor from '../../00.lore.unit/lore.action.js'
import * as ActChc from '../../02.character.unit/character.action.js'
import { resolveRepoRoot } from '../../00.lore.unit/buz/lore.buzz.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'

const UPDATE_GRID = '[Grid action] Update Grid'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'

export const openCharacterDossierSubmenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: any,
): Promise<MenuModel> => {
    const lib = (globalThis as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) bal.slv({ mnuBit: { idx: 'character-submenu-headless' } })
        return cpy
    }

    const repoRoot = resolveRepoRoot()
    const activeSlug =
        (cpy as any).activeSeriesSlug ||
        ste?.value?.lore?.activeSeriesSlug ||
        'under-the-floorboards'

    await lib.hunt(UPDATE_CONSOLE, {
        idx: 'cns00',
        src: `>> [MENU ENGAGED] Character Dossier Authoring Deck // Series: [${activeSlug}]`,
    })

    const lst = [
        '[1] SCAFFOLD NEW CHARACTER',
        '[2] SEED CORE GOBLIN CAST',
        '[3] INSPECT SOMATIC MASK',
        '[4] RUN VERB POLARITY AUDIT',
        '[5] RETIRE CHARACTER DOSSIER',
        '[6] RETURN TO LORE MENU',
    ]

    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: { clr0: 'black', clr1: 'cyan' },
        src: 'vertical',
        lst,
        net: gridBit?.grdBit?.dat,
    })

    const selection = choiceBit?.chcBit?.src

    switch (selection) {
        case '[1] SCAFFOLD NEW CHARACTER': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [CHAR WIZARD] Initializing interactive schema prompter for '${activeSlug}'...`,
            })
            await ste.hunt(ActChc.SCAFFOLD_CHARACTER, { src: activeSlug })
            break
        }

        case '[2] SEED CORE GOBLIN CAST': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [GENESIS] Writing core cast: char_bog, char_spleen, char_wart, char_mum_grissel...`,
            })
            await ste.hunt(ActChc.SEED_CORE_CHARACTERS, { src: activeSlug })
            break
        }

        case '[3] INSPECT SOMATIC MASK': {
            const headFile = path.resolve(
                repoRoot,
                'compiled',
                activeSlug,
                'bible-state.json',
            )
            let charChoices = [
                'char_bog',
                'char_spleen',
                'char_wart',
                'char_mum_grissel',
            ]
            if (fs.existsSync(headFile)) {
                try {
                    const raw = JSON.parse(fs.readFileSync(headFile, 'utf-8'))
                    const chars = Object.keys(
                        raw?.entities?.characters || raw?.characters || {},
                    )
                    if (chars.length > 0) charChoices = chars
                } catch {}
            }

            const subChoices = [...charChoices, 'CANCEL']
            const charGrid = await lib.hunt(UPDATE_GRID, {
                x: 0,
                y: 4,
                xSpan: 4,
                ySpan: Math.min(12, Math.max(6, subChoices.length + 2)),
            })

            const charSelection = await lib.hunt(OPEN_CHOICE, {
                dat: { clr0: 'black', clr1: 'cyan' },
                src: 'vertical',
                lst: subChoices,
                net: charGrid?.grdBit?.dat,
            })

            const chosenChar = charSelection?.chcBit?.src
            if (chosenChar && chosenChar !== 'CANCEL') {
                await ste.hunt(ActChc.INSPECT_SOMATIC, {
                    src: activeSlug,
                    dat: { characterId: chosenChar },
                })
            }
            break
        }

        case '[4] RUN VERB POLARITY AUDIT': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [LINT PROSE] Executing negation-aware verb polarity scanner ($T0 = $0.00)...`,
            })
            await ste.hunt(ActChc.AUDIT_CHARACTER_DOSSIER, { src: activeSlug })
            break
        }

        case '[5] RETIRE CHARACTER DOSSIER': {
            await lib.hunt(UPDATE_CONSOLE, {
                idx: 'cns00',
                src: `>> [DEPRECATION GUARD] Opening safe character retirement selector...`,
            })
            await ste.hunt(ActChc.RETIRE_CHARACTER, { src: activeSlug })
            break
        }

        case '[6] RETURN TO LORE MENU':
        default: {
            setTimeout(async () => {
                await ste.hunt(ActMnu.UPDATE_MENU, {})
            }, 100)
            return cpy
        }
    }

    // Loop back into the character submenu after command execution
    setTimeout(async () => {
        await ste.hunt(ActMnu.OPEN_CHARACTER_DOSSIER_SUBMENU, {})
    }, 333)

    return cpy
}
