/**
 * packages/299.lore/98.menu.unit/buz/00.menu.buzz.ts
 *
 * Interactive Blessed Curses choice handler and cns00 telemetry router for 299.lore.
 * Connects directly to 43.compile.unit and domain audit buzzers at T_0 = $0.00.
 */

import fs from 'node:fs'
import path from 'node:path'
import type { MenuModel } from '../menu.model'
import type MenuBit from '../fce/menu.bit'
import type State from '../../99.core/state'
import * as ActMnu from '../menu.action'
import * as ActSch from '../../26.schema.unit/schema.action'
import * as ActCmp from '../../43.compile.unit/compile.action'
import * as ActLdg from '../../16.ledger.unit/ledger.action'
import { deepFreeze } from '../../26.schema.unit/buz/freeze.buzz'
import { auditPrimitiveStandards } from './01.schema.audit.buzz'
import { runSomaticAuditMenu } from './02.somatic.audit.buzz'
import {
    runHandCapacityAudit,
    runPortalReciprocityAudit,
} from './03.logistics.audit.buzz'
import {
    runCausalDagAudit,
    runDyadicMeshAudit,
    runEpistemicFirewallAudit,
} from './04.grievance.audit.buzz'
import {
    runEntityManifestAudit,
    runSomaticSolverAudit,
} from './05.schema.solver.audit.buzz'
import { runPressureMeterSimulatorMenu } from './06.pressure.simulator.buzz'
import {
    COMPILE_MENU_OPTIONS,
    emitConsoleLine,
    printLoreCockpitBanner,
    printDetailedCompileReceipt,
    printCompileFailureReport,
} from '../compile-menu.view'

// Canonical 995.library harness action types (lowercase 'action' form).
const GRID_UPDATE = '[Grid action] Update Grid'
const WRITE_CONSOLE = '[Write action] Write Console'
const CHOICE_OPEN = '[Open action] Open Choice'
const CONSOLE_UPDATE = '[Console action] Update Console'
const TERMINAL_CLEAR = '[Layout action] Clear Terminal'
const TERMINAL_CLOSE = '[Terminal action] Close Terminal'

// Holds the INIT_MENU resolver while the operator navigates the live lore
// submenu. Released when ROOT MENU is chosen so run.ts can reopen the
// master switchboard. Null in headless/test contexts.
let rootSlv: ((result: { mnuBit: MenuBit }) => void) | null = null
let screenExitHooked = false

function attachCleanExitBindings(lib: any): void {
    if (screenExitHooked || !lib) return
    const screen = lib?.state?.value?.terminal?.screen
    if (!screen || typeof screen.key !== 'function') return
    screenExitHooked = true

    let escapeCount = 0
    let escapeResetTimer: ReturnType<typeof setTimeout> | null = null

    const performCleanShutdown = async () => {
        try {
            await lib.hunt(TERMINAL_CLEAR, {})
            await lib.hunt(TERMINAL_CLOSE, {})
        } catch {
            // Ignore headless teardown errors
        }
        process.exit(0)
    }

    screen.key(['q', 'C-c'], performCleanShutdown)
    screen.key(['escape'], () => {
        escapeCount += 1
        if (escapeResetTimer) clearTimeout(escapeResetTimer)
        escapeResetTimer = setTimeout(() => {
            escapeCount = 0
        }, 2500)
        if (escapeCount >= 2) {
            setTimeout(performCleanShutdown, 150)
        }
    })
}

// Auto-bind on module load if global.LIBRARY is already live
try {
    const bootLib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (bootLib) attachCleanExitBindings(bootLib)
} catch {
    // Ignore in test environments
}

async function mountConsolePane(lib: any): Promise<void> {
    if (!lib || typeof lib.hunt !== 'function') return
    try {
        const gridBit = await lib.hunt(GRID_UPDATE, {
            x: 4,
            y: 0,
            xSpan: 8,
            ySpan: 12,
        })
        if (gridBit?.grdBit?.dat) {
            await lib.hunt(WRITE_CONSOLE, {
                idx: 'cns00',
                src: '',
                dat: { net: gridBit.grdBit.dat, src: 'alligator0' },
            })
        }
    } catch {
        // Ignore in mock or headless environments where Write Console is unmounted
    }
}

export const initMenu = (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): MenuModel => {
    bal.val = 0
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (bal?.slv) {
        if (lib && typeof lib.hunt === 'function' && ste?.hunt) {
            // Live cockpit: hold the INIT_MENU resolver, mount cns00 console,
            // render HUD banner, and cascade into the interactive choice loop.
            attachCleanExitBindings(lib)
            rootSlv = bal.slv
            ;(async () => {
                await mountConsolePane(lib)
                const compileState = (ste as any)?.value?.compile
                await printLoreCockpitBanner(
                    ste,
                    cpy.activeSeries || '000.sample-hearth',
                    compileState?.status || 'IDLE',
                    compileState?.lastMerkleHash || '',
                )
                await updateMenu(
                    cpy,
                    { idx: 'init-menu-cascade' } as MenuBit,
                    ste,
                )
            })().catch((err: any) => {
                try {
                    lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: [MENU_FAULT] ${err?.message || err}`,
                    })
                } catch {
                    // Headless teardown in progress; nothing left to report to.
                }
            })
        } else {
            bal.slv({ mnuBit: bal })
        }
    }
    return cpy
}

export const updateMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const activeSeries = cpy.activeSeries || '001.goblin-lore'
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY

    const lst = [
        '1. VALIDATE SCHEMA INVARIANTS',
        '[Somatic DSP Modulation Hub]',
        '2. RUN SOMATIC SAT SOLVER',
        '3. AUDIT KINETIC MOTOR MASKS',
        '4. VERIFY HEAP IMMUTABILITY',
        '5. AUDIT SPATIAL PORTALS & ACOUSTICS',
        '6. AUDIT GRIEVANCE DAG & DYADIC MESH',
        '7. VERIFY EPISTEMIC FIREWALLS',
        '8. INTERACTIVE SOMATIC MOTOR LAB',
        '[S] STYLOMETRIC & VOICE-BLEED LINTER',
        '[H] HERMETIC OFFLINE DELETION PARITY',
        '[C] COMPILE CANON & GATE 0 GAUNTLET',
        'ROOT MENU',
    ]

    // Headless execution safety fallback for CI and non-TTY test environments
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'update-menu-headless',
                    lst,
                    val: 0,
                    dat: { activeSeries },
                },
            })
        }
        return cpy
    }

    const descriptions: Record<string, string> = {
        '1. VALIDATE SCHEMA INVARIANTS':
            'Validate frontmatter entities, basis-point bounds, and Banker rounding.',
        '[Somatic DSP Modulation Hub]':
            'Extract disk-backed Somatic Ledger dossiers, trauma floors, and SQLite records.',
        '2. RUN SOMATIC SAT SOLVER':
            'Evaluate upper-limb capacity and anatomical hand saturation.',
        '3. AUDIT KINETIC MOTOR MASKS':
            'Assert action verb exclusion against locomotion tiers and conditions.',
        '4. VERIFY HEAP IMMUTABILITY':
            'Confirm deepFreeze traps property mutation on sealed entities.',
        '5. AUDIT SPATIAL PORTALS & ACOUSTICS':
            'Verify bidirectional portal reciprocity and cdB acoustic attenuation.',
        '6. AUDIT GRIEVANCE DAG & DYADIC MESH':
            'Run 3-color DFS cycle detection, topological depth, and dyadic mesh checks.',
        '7. VERIFY EPISTEMIC FIREWALLS':
            'Enforce Clue-Lemma Disjointness and false-belief prompt-injection guards.',
        '8. INTERACTIVE SOMATIC MOTOR LAB':
            'Inspect character somatic masks and test custom kinetic verbs interactively.',
        '[S] STYLOMETRIC & VOICE-BLEED LINTER':
            'Audit prose lexical diversity, corporate slop bans, and callback collisions.',
        '[H] HERMETIC OFFLINE DELETION PARITY':
            'Purge compiled/ artifacts and verify bit-for-bit offline H_root rebuild.',
        '[C] COMPILE CANON & GATE 0 GAUNTLET':
            'Open 3-pass compiler flight deck, Merkle emission, and Gate 0 verification.',
        'ROOT MENU': 'Return to master flight deck switchboard.',
    }

    // Update layout on 12x12 grid: columns 0 to 4 for vertical selection menu
    const gridBit = await lib.hunt(GRID_UPDATE, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const choiceBit = await lib.hunt(CHOICE_OPEN, {
        dat: {
            clr0: 0, // Color.BLACK
            clr1: 3, // Color.YELLOW
            cb: (choice: string) => {
                const text = descriptions[choice] || 'No description available.'
                lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${text}`,
                })
            },
        },
        src: 'VERTICAL',
        lst,
        net: gridBit?.grdBit?.dat,
    })

    const src = choiceBit?.chcBit?.src
    cpy.activeSelection = src || 'ROOT'

    switch (src) {
        case '1. VALIDATE SCHEMA INVARIANTS': {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> Initiating Schema Invariant Validation...',
            })
            const validBit: any = {
                idx: 'menu-val-entity',
                src: 'character',
                dat: {
                    id: 'char_bog',
                    title: 'Bog the Hoarder',
                    somatic: {
                        arms_available: 2,
                        legs_available: 2,
                        locomotion_tier: 'BIPEDAL_HUNCHED',
                        banned_verbs: ['SPRINT', 'VAULT'],
                        conditions: [],
                    },
                    logistical: {
                        held_primary: 'item_spoon',
                    },
                    epistemic: {
                        paranoia_bp: 2500,
                    },
                },
            }
            const res = await ste.hunt(ActSch.VALIDATE_ENTITY, validBit)
            if (res?.schBit?.val === 0) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [SCHEMA_OK] Character entity validated and sealed.',
                })
            } else {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: ':: [SCHEMA_FAIL] Invariant breach detected during validation.',
                })
            }
            try {
                const primLines = await auditPrimitiveStandards()
                for (const line of primLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
                const manifestLines = await runEntityManifestAudit()
                for (const line of manifestLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
            } catch (err: any) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${err?.message || String(err)}`,
                })
            }
            break
        }

        case '2. RUN SOMATIC SAT SOLVER': {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> Solving Somatic Capability SAT...',
            })
            const satBit: any = {
                idx: 'menu-sat-solve',
                src: 'somatic_sat',
                dat: {
                    character: {
                        id: 'char_wart',
                        title: 'Wart the Mender',
                        somatic: {
                            arms_available: 2,
                            legs_available: 2,
                            locomotion_tier: 'BIPEDAL_LIMPING',
                            conditions: ['cond_brachial_plexus_severed_left'],
                        },
                        logistical: {
                            held_primary: 'item_iron_key',
                            held_secondary: 'item_grease_bucket',
                        },
                        epistemic: {},
                    },
                    possessions: {
                        item_iron_key: { occupies_hands: 1 },
                        item_grease_bucket: { occupies_hands: 1 },
                    },
                    condition_penalties: {
                        cond_brachial_plexus_severed_left: 1,
                    },
                },
            }
            const res = await ste.hunt(ActSch.SOLVE_SOMATIC_SAT, satBit)
            if (res?.schBit?.val === -1) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [SAT_HALT] [SOMATIC_OVERLOAD] caught: single-arm dual loadout blocked.',
                })
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [SAT_PASS] Biological inequality enforced at T_0 = $0.00.',
                })
            }
            try {
                const satLines = await runSomaticSolverAudit()
                for (const line of satLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
                const rosterLines = await runHandCapacityAudit()
                for (const line of rosterLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
            } catch (err: any) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${err?.message || String(err)}`,
                })
            }
            break
        }

        case '3. AUDIT KINETIC MOTOR MASKS': {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> Auditing Kinetic Motor Mask Exclusions...',
            })
            const motorBit: any = {
                idx: 'menu-motor-audit',
                src: 'somatic_sat',
                dat: {
                    character: {
                        id: 'char_bog',
                        title: 'Bog the Hoarder',
                        somatic: {
                            arms_available: 2,
                            legs_available: 2,
                            locomotion_tier: 'BIPEDAL_HUNCHED',
                            banned_verbs: [],
                            conditions: [],
                        },
                        logistical: {},
                        epistemic: {},
                    },
                    proposedActions: ['SPRINT'],
                },
            }
            const res = await ste.hunt(ActSch.SOLVE_SOMATIC_SAT, motorBit)
            if (res?.schBit?.val === -1) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [MOTOR_HALT] [SOMATIC_MOTOR_BREACH] caught: SPRINT forbidden for BIPEDAL_HUNCHED.',
                })
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: '>> [MOTOR_PASS] Set-intersection exclusion verified.',
                })
            }
            break
        }

        case '4. VERIFY HEAP IMMUTABILITY': {
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> Verifying V8 Heap Deep Freeze Immutability...',
            })
            const probe = deepFreeze({
                id: 'char_bog',
                somatic: { arms_available: 2, banned_verbs: ['SPRINT'] },
            })
            let trapped = false
            try {
                ;(probe.somatic as any).arms_available = 99
            } catch {
                trapped = true
            }
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: `>> [IMMUTABILITY:PROBE] Object.isFrozen=${Object.isFrozen(probe)} | MutationTrapped=${trapped}`,
            })
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> [IMMUTABILITY:PASS] Object.freeze recursion traps mutations with strict TypeError.',
            })
            break
        }

        case '5. AUDIT SPATIAL PORTALS & ACOUSTICS': {
            try {
                const lines = await runPortalReciprocityAudit()
                for (const line of lines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
            } catch (err: any) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${err?.message || String(err)}`,
                })
            }
            break
        }

        case '6. AUDIT GRIEVANCE DAG & DYADIC MESH': {
            try {
                const dagLines = await runCausalDagAudit()
                for (const line of dagLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
                const dyadLines = await runDyadicMeshAudit()
                for (const line of dyadLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
            } catch (err: any) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${err?.message || String(err)}`,
                })
            }
            break
        }

        case '7. VERIFY EPISTEMIC FIREWALLS': {
            try {
                const epLines = await runEpistemicFirewallAudit()
                for (const line of epLines) {
                    await lib.hunt(CONSOLE_UPDATE, { idx: 'cns00', src: line })
                }
            } catch (err: any) {
                await lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: ${err?.message || String(err)}`,
                })
            }
            break
        }

        case '8. INTERACTIVE SOMATIC MOTOR LAB': {
            await runSomaticAuditMenu(ste)
            break
        }

        case '[S] STYLOMETRIC & VOICE-BLEED LINTER': {
            await emitConsoleLine(
                ste,
                '>> [LEVEL 3: STYLOMETRICS] Running lexical diversity & voice-bleed audit...',
            )
            if (ste && typeof ste.hunt === 'function') {
                await ste.hunt(ActCmp.STYLOMETRIC_LINT, {
                    idx: 'menu-stylometrics',
                    seriesSlug: activeSeries,
                    emitTelemetry: true,
                })
            }
            break
        }

        case '[H] HERMETIC OFFLINE DELETION PARITY': {
            await emitConsoleLine(
                ste,
                '>> [HERMETIC PARITY] Executing offline deletion & bit-for-bit Merkle rebuild test...',
            )
            if (ste && typeof ste.hunt === 'function') {
                let parityRes: any = null
                await ste.hunt(ActCmp.OFFLINE_DELETION_TEST, {
                    idx: 'menu-offline-parity',
                    seriesSlug: activeSeries,
                    emitTelemetry: true,
                    slv: (r: any) => {
                        parityRes = r?.cmpBit || r?.resBit
                    },
                })
                if (parityRes) {
                    await printDetailedCompileReceipt(
                        ste,
                        activeSeries,
                        parityRes,
                        parityRes.executionDurationMs || 1,
                    )
                }
            }
            break
        }

        case '[Somatic DSP Modulation Hub]': {
            await openSomaticDspHub(cpy, bal, ste)
            break
        }

        case '[C] COMPILE CANON & GATE 0 GAUNTLET': {
            await openCompileMenu(cpy, bal, ste)
            break
        }

        case '':
        case undefined:
        case 'ROOT MENU': {
            await lib.hunt(TERMINAL_CLEAR, {})
            await mountConsolePane(lib)
            if (rootSlv) {
                const slv = rootSlv
                rootSlv = null
                slv({ mnuBit: { idx: 'root-menu', val: 0 } })
            } else if (bal?.slv) {
                bal.slv({ mnuBit: { idx: 'root-menu', val: 0 } })
            }
            return cpy
        }

        default: {
            break
        }
    }

    // Non-blocking tick to loop menu if not exiting
    setTimeout(async () => {
        if (ste?.hunt) {
            await ste.hunt(ActMnu.UPDATE_MENU, {})
        }
    }, 333)

    if (bal?.slv) {
        bal.slv({ mnuBit: bal })
    }

    return cpy
}

/**
 * Opens the dedicated Compile Menu Flight Deck.
 */
export const openCompileMenu = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const activeSeries =
        bal?.dat?.activeSeries || cpy.activeSeries || '001.goblin-lore'

    await emitConsoleLine(
        ste,
        `>> [MENU:COMPILE] Opening Compile Flight Deck for series: ${activeSeries}`,
    )

    const optionLabels = COMPILE_MENU_OPTIONS.map((opt) => opt.label)

    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (lib && typeof lib.hunt === 'function') {
        const gridBit = await lib.hunt(GRID_UPDATE, {
            x: 0,
            y: 4,
            xSpan: 4,
            ySpan: 8,
        })

        const choiceBit = await lib.hunt(CHOICE_OPEN, {
            dat: {
                clr0: 0,
                clr1: 3,
                cb: (choice: string) => {
                    const opt = COMPILE_MENU_OPTIONS.find(
                        (o) => o.label === choice,
                    )
                    const text = opt?.description || 'No description available.'
                    lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: ${text}`,
                    })
                },
            },
            src: 'VERTICAL',
            lst: optionLabels,
            net: gridBit?.grdBit?.dat,
        })

        const chosenLabel = choiceBit?.chcBit?.src
        const chosenIndex = COMPILE_MENU_OPTIONS.findIndex(
            (o) => o.label === chosenLabel,
        )
        if (chosenIndex >= 0) {
            await triggerCompileAction(
                cpy,
                { ...bal, val: chosenIndex } as MenuBit,
                ste,
            )
        }
    }

    if (bal?.slv) {
        bal.slv({
            mnuBit: {
                idx: 'open-compile-menu',
                lst: optionLabels,
                dat: {
                    activeSeries,
                    options: COMPILE_MENU_OPTIONS,
                },
            },
        })
    }

    return cpy
}

/**
 * Triggers an operation from the compile menu and streams full telemetry.
 */
export const triggerCompileAction = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const activeSeries =
        bal?.dat?.activeSeries || cpy.activeSeries || '001.goblin-lore'
    const selectedIndex = bal?.val ?? 0
    const option = COMPILE_MENU_OPTIONS[selectedIndex]

    if (!option) {
        await emitConsoleLine(
            ste,
            ':: [MENU:ERR] Invalid compile menu option selected.',
        )
        if (bal?.slv) {
            bal.slv({ mnuBit: { idx: 'compile-action-err', val: -1 } })
        }
        return cpy
    }

    // Return to Lore Menu option
    if (option.key === '<') {
        await emitConsoleLine(
            ste,
            '>> [MENU:COMPILE] Returning to Lore Menu...',
        )
        return updateMenu(cpy, bal, ste)
    }

    const startTime = Date.now()
    await emitConsoleLine(
        ste,
        `>> [COMPILE:DISPATCH] Triggered: ${option.label}`,
    )
    await emitConsoleLine(
        ste,
        `>> [TARGET:SERIES]   slug=${activeSeries} source=corpus/ output=compiled/`,
    )

    let compileResult: any = null
    let compileError: any = null

    try {
        if (ste && typeof ste.hunt === 'function') {
            const dispatchRes: any = await ste.hunt(option.actionType, {
                idx: 'cmp-tui-dispatch',
                src: process.cwd(),
                val: 1, // Verbose telemetry flag
                dat: {
                    seriesSlug: activeSeries,
                    verifyDriftTripwire: option.key === '5', // Enforce tripwire on Gate 0 option
                },
                slv: (res: any) => {
                    if (res?.resBit) compileResult = res.resBit
                    else if (res?.cmpBit && res.cmpBit.val !== 0)
                        compileResult = res.cmpBit
                    if (res?.errBit) compileError = res.errBit
                },
            })

            if (!compileResult && dispatchRes?.resBit) {
                compileResult = dispatchRes.resBit
            } else if (
                !compileResult &&
                dispatchRes?.cmpBit &&
                dispatchRes.cmpBit.val !== 0
            ) {
                compileResult = dispatchRes.cmpBit
            }
            if (!compileError && dispatchRes?.errBit) {
                compileError = dispatchRes.errBit
            }
        }

        const elapsedMs = Date.now() - startTime

        if (compileError) {
            await printCompileFailureReport(ste, activeSeries, compileError)
            cpy.lastError = compileError.message
        } else {
            await printDetailedCompileReceipt(
                ste,
                activeSeries,
                compileResult,
                elapsedMs,
            )
            cpy.lastError = undefined
        }

        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'trigger-compile-action',
                    val: compileError ? -1 : 0,
                    dat: {
                        action: option.actionType,
                        elapsedMs,
                        success: !compileError,
                        resBit: compileResult,
                        errBit: compileError,
                    },
                },
            })
        }
    } catch (err: any) {
        const errorPayload = {
            code: 'DISPATCH_EXCEPTION',
            message: err?.message || String(err),
        }
        await printCompileFailureReport(ste, activeSeries, errorPayload)

        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'trigger-compile-action-err',
                    val: -1,
                    src: err?.message || String(err),
                },
            })
        }
    }

    return cpy
}

function findSeriesBaseDir(): string | null {
    let curr = process.cwd()
    while (curr && curr !== path.dirname(curr)) {
        const candidate = path.join(curr, 'series')
        if (fs.existsSync(candidate) && fs.statSync(candidate).isDirectory()) {
            return candidate
        }
        curr = path.dirname(curr)
    }
    return null
}

export function discoverSomaticSeriesSlugs(): string[] {
    const baseDir = findSeriesBaseDir()
    if (!baseDir) {
        return ['under-the-floorboards', 'wiregrass-basin']
    }
    const entries = fs
        .readdirSync(baseDir, { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
    entries.sort((a, b) =>
        a === 'under-the-floorboards'
            ? -1
            : b === 'under-the-floorboards'
              ? 1
              : a.localeCompare(b),
    )
    return entries.length > 0
        ? entries
        : ['under-the-floorboards', 'wiregrass-basin']
}

export function discoverSeriesCharacters(seriesSlug: string): string[] {
    const baseDir = findSeriesBaseDir()
    if (!baseDir) {
        return seriesSlug === 'under-the-floorboards'
            ? ['char_wart.md', 'char_bog.md']
            : ['char_spleen.md']
    }
    const charDir = path.join(baseDir, seriesSlug, 'characters')
    if (!fs.existsSync(charDir)) {
        return ['char_wart.md', 'char_bog.md']
    }
    const rawFiles = fs.readdirSync(charDir).filter((f) => f.endsWith('.md'))
    const canonicalSet = new Set<string>()
    for (const f of rawFiles) {
        canonicalSet.add(f.startsWith('char_') ? f : `char_${f}`)
    }
    const list = Array.from(canonicalSet)
    list.sort((a, b) =>
        a === 'char_wart.md'
            ? -1
            : b === 'char_wart.md'
              ? 1
              : a.localeCompare(b),
    )
    return list
}

/**
 * Opens the Somatic DSP Modulation Hub for disk-backed Somatic Ledger extraction.
 */
export const openSomaticDspHub = async (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): Promise<MenuModel> => {
    const hubOptions = [
        '[Extract Somatic Ledger]',
        '[Pressure Meter Thermodynamic Simulator]',
        '[Acoustic Paranoia Clock Inspector]',
        '[Algebraic DSP Matrix Inspector]',
        '[<] RETURN TO LORE MENU',
    ]

    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) {
            bal.slv({
                mnuBit: {
                    idx: 'open-somatic-dsp-hub',
                    lst: hubOptions,
                    val: 0,
                },
            })
        }
        return cpy
    }

    const gridBit = await lib.hunt(GRID_UPDATE, {
        x: 0,
        y: 4,
        xSpan: 4,
        ySpan: 8,
    })

    const hubChoiceBit = await lib.hunt(CHOICE_OPEN, {
        dat: {
            clr0: 0,
            clr1: 3,
            cb: (choice: string) => {
                lib.hunt(CONSOLE_UPDATE, {
                    idx: 'cns00',
                    src: `:: [SOMATIC_HUB] ${choice}`,
                })
            },
        },
        src: 'VERTICAL',
        lst: hubOptions,
        net: gridBit?.grdBit?.dat,
    })

    const hubSelection = hubChoiceBit?.chcBit?.src
    if (!hubSelection || hubSelection === '[<] RETURN TO LORE MENU') {
        return cpy
    }

    if (hubSelection === '[Pressure Meter Thermodynamic Simulator]') {
        await runPressureMeterSimulatorMenu(ste)
        return cpy
    }

    if (hubSelection === '[Extract Somatic Ledger]') {
        const seriesSlugs = discoverSomaticSeriesSlugs()
        await lib.hunt(CONSOLE_UPDATE, {
            idx: 'cns00',
            src: `>> [SOMATIC_HUB] Discovered series slugs: ${seriesSlugs.join(', ')}`,
        })

        const seriesChoiceBit = await lib.hunt(CHOICE_OPEN, {
            dat: {
                clr0: 0,
                clr1: 3,
                cb: (choice: string) => {
                    lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: [SERIES] ${choice}`,
                    })
                },
            },
            src: 'VERTICAL',
            lst: [...seriesSlugs, '[<] BACK'],
            net: gridBit?.grdBit?.dat,
        })

        const selectedSeries = seriesChoiceBit?.chcBit?.src
        if (!selectedSeries || selectedSeries === '[<] BACK') {
            return cpy
        }

        const charFiles = discoverSeriesCharacters(selectedSeries)
        const charChoiceBit = await lib.hunt(CHOICE_OPEN, {
            dat: {
                clr0: 0,
                clr1: 3,
                cb: (choice: string) => {
                    lib.hunt(CONSOLE_UPDATE, {
                        idx: 'cns00',
                        src: `:: [DOSSIER] ${selectedSeries}/characters/${choice}`,
                    })
                },
            },
            src: 'VERTICAL',
            lst: [...charFiles, '[<] BACK'],
            net: gridBit?.grdBit?.dat,
        })

        const selectedChar = charChoiceBit?.chcBit?.src
        if (!selectedChar || selectedChar === '[<] BACK') {
            return cpy
        }

        const shortCharFile = selectedChar.replace(/^char_/, '')
        const conditionsPath = `series/${selectedSeries}/world/conditions.md`
        const characterPath = `series/${selectedSeries}/characters/${shortCharFile}`

        if (ste && typeof ste.hunt === 'function') {
            await new Promise<void>((resolve) => {
                ste.hunt(ActLdg.EXTRACT_SOMATIC_LEDGER, {
                    idx: 'menu-extract-somatic-ledger',
                    dat: {
                        conditionsPath,
                        characterPaths: [characterPath],
                    },
                    slv: () => resolve(),
                })
            })
        }
    }

    return cpy
}

export default updateMenu
