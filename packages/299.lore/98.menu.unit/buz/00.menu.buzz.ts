import * as ActMnu from '../menu.action.js'
import type { MenuModel } from '../menu.model.js'
import type MenuBit from '../fce/menu.bit.js'
import type State from '../../99.core/state.js'
import {
    runFactScopeMenuAudit,
    runAuthorityLevelMenuAudit,
    runSequenceMenuAudit,
    runLiminalStatusMenuAudit,
    runCanonHashMenuAudit,
    runByteZeroMenuAudit,
    runPreWriteInterceptorMenuAudit,
    runFactRegistryMenuAudit,
    runFullNegativeControlGauntlet,
} from './menu.buzz.js'
import { executeNegativeControlSchemaGauntlet } from './schemaGauntlet.buzz.js'

let rootSlv: any

const UPDATE_GRID = '[Grid action] Update Grid'
const WRITE_CONSOLE = '[Write action] Write Console'
const UPDATE_CONSOLE = '[Console action] Update Console'
const OPEN_CHOICE = '[Open action] Open Choice'
const CLOSE_TERMINAL = '[Close action] Close Terminal'

const createConsoleLogger = (lib: any) => ({
    log: (msg: string) => {
        lib.hunt(UPDATE_CONSOLE, { idx: 'cns00', src: msg })
    },
})

export const initMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    if (bal?.slv != null) rootSlv = bal.slv

    const lib = (globalThis as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        const bit = await lib.hunt(UPDATE_GRID, {
            x: 4,
            y: 0,
            xSpan: 8,
            ySpan: 12,
        })
        await lib.hunt(WRITE_CONSOLE, {
            idx: 'cns00',
            src: '',
            dat: { net: bit?.grdBit?.dat, src: 'lore0' },
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '--------------------------------------------------',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> GOBLIN-LORE LEGISLATIVE CONTROL DECK [ONLINE]',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '>> T0 Semantic Invariance & Epistemic Protection',
        })
        await lib.hunt(UPDATE_CONSOLE, {
            idx: 'cns00',
            src: '--------------------------------------------------',
        })
    }

    await updateMenu(cpy, bal, ste)
    return cpy
}

export const updateMenu = async (cpy: MenuModel, bal: MenuBit, ste: State) => {
    const lib = (globalThis as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv)
            bal.slv({
                mnuBit: { idx: 'update-menu-headless', src: 'HEADLESS_BYPASS' },
            })
        return cpy
    }

    const lst = [
        'FACT SCHEMA CONTRACT',
        'COMPILE LORE INSTANCE',
        'INSPECT CANON BIBLE',
        'AUDIT CORPUS INTEGRITY',
        'ROOT MENU',
    ]

    const gridBit = await lib.hunt(UPDATE_GRID, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })
    const choiceBit = await lib.hunt(OPEN_CHOICE, {
        dat: { clr0: 'black', clr1: 'yellow' },
        src: 'vertical',
        lst,
        net: gridBit?.grdBit?.dat,
    })

    const selection = choiceBit?.chcBit?.src
    cpy.lastSelection = selection

    switch (selection) {
        case 'FACT SCHEMA CONTRACT':
        case '[FACT SCHEMA CONTRACT]':
            await openFactSchemaSubmenu(cpy, bal, ste)
            break

        case 'ROOT MENU':
            if (rootSlv != null) rootSlv({ mnuBit: { idx: 'root-menu' } })
            return cpy

        default:
            break
    }

    setTimeout(async () => {
        if (ste && typeof ste.hunt === 'function') {
            await ste.hunt(ActMnu.UPDATE_MENU, {})
        }
    }, 333)

    return cpy
}

export const openFactSchemaSubmenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
) => {
    const lib = (globalThis as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        return cpy
    }

    const logger = createConsoleLogger(lib)
    let stayInSubmenu = true

    const subOptions = [
        '[1] Validate Fact Scope & ID Prefix Enumerations',
        '[2] Audit Authority Level Stratification',
        '[3] Run Monotonic Sequential Increment Verifier',
        '[4] Execute Negative-Control Schema Trap Gauntlet (T_0 = $0.00)',
        '[4] Audit Zero-Cascade Liminal Standing Transitions',
        '[5] Audit Unicode NFC Content Hasher & Parity',
        '[6] Audit Byte-Zero Frontmatter Extractor',
        '[7] Test Pre-Write Local SQLite Schema Interceptor',
        '[8] Inspect Deep-Frozen Fact Registry Store',
        '[9] Execute Full Negative-Control Trap Gauntlet',
        'BACK TO ROOT MENU',
    ]

    const descriptions: Record<string, string> = {
        '[1] Validate Fact Scope & ID Prefix Enumerations':
            'Verify four-quadrant scopes and mandatory char_, loc_, item_, law_ prefixes.',
        '[2] Audit Authority Level Stratification':
            'Verify 6-tier hierarchy from AXIOM (600) to SPECULATION (100) and demotion blocks.',
        '[3] Run Monotonic Sequential Increment Verifier':
            'Verify strict contiguous increment v_{n+1} = v_n + 1 and trap gaps or silent edits.',
        '[4] Execute Negative-Control Schema Trap Gauntlet (T_0 = $0.00)':
            'Run exhaustive fail-closed regression battery across all units at T0 = $0.00.',
        '[4] Audit Zero-Cascade Liminal Standing Transitions':
            'Verify FLAGGED_FOR_REVIEW triggers zero scene invalidation cascades.',
        '[5] Audit Unicode NFC Content Hasher & Parity':
            'Verify precomposed and decomposed Unicode produce bit-identical SHA-256 hashes.',
        '[6] Audit Byte-Zero Frontmatter Extractor':
            'Verify 0x2D 0x2D 0x2D 0x0A delimiter and trap UTF-8 BOM or non-POSIX CRLF.',
        '[7] Test Pre-Write Local SQLite Schema Interceptor':
            'Verify in-memory pre-SQL firewalling for local pilot.db tables.',
        '[8] Inspect Deep-Frozen Fact Registry Store':
            'Verify O(1) in-memory lookups and TypeError on object mutation.',
        '[9] Execute Full Negative-Control Trap Gauntlet':
            'Run exhaustive fail-closed regression battery across all units at T0 = $0.00.',
        'BACK TO ROOT MENU': 'Return to the main runner switchboard.',
    }

    while (stayInSubmenu) {
        const subGrid = await lib.hunt(UPDATE_GRID, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 12,
        })

        const subChoice = await lib.hunt(OPEN_CHOICE, {
            dat: {
                clr0: 'black',
                clr1: 'yellow',
                cb: (choice: string) => {
                    const desc =
                        descriptions[choice] || 'No description available.'
                    lib.hunt(UPDATE_CONSOLE, {
                        idx: 'cns00',
                        src: `>> ${desc}`,
                    })
                },
            },
            src: 'vertical',
            lst: subOptions,
            net: subGrid?.grdBit?.dat,
        })

        const selectedItem = subChoice?.chcBit?.src

        switch (selectedItem) {
            case '[1] Validate Fact Scope & ID Prefix Enumerations':
                runFactScopeMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[2] Audit Authority Level Stratification':
                runAuthorityLevelMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[3] Run Monotonic Sequential Increment Verifier':
                runSequenceMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[4] Execute Negative-Control Schema Trap Gauntlet (T_0 = $0.00)':
                await executeNegativeControlSchemaGauntlet(logger.log)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[4] Audit Zero-Cascade Liminal Standing Transitions':
                runLiminalStatusMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[5] Audit Unicode NFC Content Hasher & Parity':
                runCanonHashMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[6] Audit Byte-Zero Frontmatter Extractor':
                runByteZeroMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[7] Test Pre-Write Local SQLite Schema Interceptor':
                runPreWriteInterceptorMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[8] Inspect Deep-Frozen Fact Registry Store':
                runFactRegistryMenuAudit(logger)
                await new Promise((r) => setTimeout(r, 2000))
                break

            case '[9] Execute Full Negative-Control Trap Gauntlet':
                runFullNegativeControlGauntlet(logger)
                await new Promise((r) => setTimeout(r, 3000))
                break

            case 'BACK TO ROOT MENU':
            default:
                stayInSubmenu = false
                break
        }
    }

    return cpy
}

export const handleGauntletMenuChoice = async (
    cns00Channel: string = 'cns00',
) => {
    const lib = (globalThis as any).LIBRARY
    const logger = (msg: string) => {
        if (lib && typeof lib.hunt === 'function') {
            lib.hunt('[Console action] Update Console', {
                idx: cns00Channel,
                src: msg,
            })
        }
    }
    return await executeNegativeControlSchemaGauntlet(logger)
}
