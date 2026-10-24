import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MenuModel } from '../menu.model.js'
import { reducer } from '../menu.reduce.js'
import * as Act from '../act/menu.action.js'
import { openCharacterDossierSubmenu } from '../buz/characterMenu.buzz.js'

describe('98.menu.unit: Character Authoring Submenu Grid Mounting', () => {
    let originalLibrary: any

    beforeEach(() => {
        originalLibrary = (globalThis as any).LIBRARY
        delete (globalThis as any).LIBRARY
    })

    afterEach(() => {
        if (originalLibrary !== undefined) {
            ;(globalThis as any).LIBRARY = originalLibrary
        } else {
            delete (globalThis as any).LIBRARY
        }
    })

    it('Check 4.2: Headless bypass returns character-submenu-headless without error', async () => {
        let resolvedBit: any = null
        const bal: any = {
            slv: (result: any) => {
                resolvedBit = result
            },
        }

        const model = new MenuModel()
        const res = await openCharacterDossierSubmenu(model, bal, {} as any)

        expect(res).toBeDefined()
        expect(resolvedBit).toEqual({
            mnuBit: { idx: 'character-submenu-headless' },
        })
    })

    it('Check 1.2: Reducer handles OPEN_CHARACTER_DOSSIER_SUBMENU action', async () => {
        let resolvedBit: any = null
        const action = new Act.OpenCharacterDossierSubmenu({
            slv: (result: any) => {
                resolvedBit = result
            },
        } as any)

        const model = new MenuModel()
        const resultPromise = reducer(model, action)
        await resultPromise

        expect(resolvedBit).toEqual({
            mnuBit: { idx: 'character-submenu-headless' },
        })
    })

    it('Check 2.2 & 2.3: Interacts with 12x12 Blessed Grid and 6-item choice array', async () => {
        const calls: { action: string; dat: any }[] = []
        ;(globalThis as any).LIBRARY = {
            hunt: async (action: string, dat: any) => {
                calls.push({ action, dat })
                if (action === '[Grid action] Update Grid') {
                    return { grdBit: { dat: 'mock-grid-net' } }
                }
                if (action === '[Open action] Open Choice') {
                    return { chcBit: { src: '[6] RETURN TO LORE MENU' } }
                }
                return {}
            },
        }

        const dispatches: { action: string; dat: any }[] = []
        const mockSte = {
            hunt: async (action: any, dat: any) => {
                dispatches.push({ action, dat })
            },
            value: { lore: { activeSeriesSlug: 'under-the-floorboards' } },
        }

        const model = new MenuModel()
        await openCharacterDossierSubmenu(model, {} as any, mockSte)

        const consoleCall = calls.find(
            (c) => c.action === '[Console action] Update Console',
        )
        expect(consoleCall).toBeDefined()
        expect(consoleCall?.dat.src).toContain(
            '>> [MENU ENGAGED] Character Dossier Authoring Deck',
        )
        expect(consoleCall?.dat.src).toContain('under-the-floorboards')

        const gridCall = calls.find(
            (c) => c.action === '[Grid action] Update Grid',
        )
        expect(gridCall).toBeDefined()
        expect(gridCall?.dat).toEqual({
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 8,
        })

        const choiceCall = calls.find(
            (c) => c.action === '[Open action] Open Choice',
        )
        expect(choiceCall).toBeDefined()
        expect(choiceCall?.dat.lst).toEqual([
            '[1] SCAFFOLD NEW CHARACTER',
            '[2] SEED CORE GOBLIN CAST',
            '[3] INSPECT SOMATIC MASK',
            '[4] RUN VERB POLARITY AUDIT',
            '[5] RETIRE CHARACTER DOSSIER',
            '[6] RETURN TO LORE MENU',
        ])
        expect(choiceCall?.dat.dat).toEqual({ clr0: 'black', clr1: 'cyan' })
    })
})
