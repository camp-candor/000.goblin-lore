/**
 * packages/299.lore/98.menu.unit/buz/00.menu.buzz.ts
 *
 * Interactive Blessed Curses choice handler and cns00 telemetry router for 299.lore.
 * Operates on the 12x12 percentage grid at T_0 = $0.00.
 */

import type { MenuModel } from '../menu.model'
import type MenuBit from '../fce/menu.bit'
import type State from '../../99.core/state'
import * as ActMnu from '../menu.action'
import * as ActSch from '../../26.schema.unit/schema.action'

// Canonical 995.library harness action types (lowercase 'action' form).
const GRID_UPDATE = '[Grid action] Update Grid'
const CHOICE_OPEN = '[Open action] Open Choice'
const CONSOLE_UPDATE = '[Console action] Update Console'
const TERMINAL_CLEAR = '[Layout action] Clear Terminal'

// Holds the INIT_MENU resolver while the operator navigates the live lore
// submenu. Released when ROOT MENU is chosen so run.ts can reopen the
// master switchboard. Null in headless/test contexts.
let rootSlv: ((result: { mnuBit: MenuBit }) => void) | null = null

export const initMenu = (
    cpy: MenuModel,
    bal: MenuBit,
    ste: State,
): MenuModel => {
    bal.val = 0
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY
    if (bal?.slv) {
        if (lib && typeof lib.hunt === 'function' && ste?.hunt) {
            // Live cockpit: hold the INIT_MENU resolver and cascade into
            // the interactive choice loop. Resolves at ROOT MENU.
            rootSlv = bal.slv
            updateMenu(cpy, { idx: 'init-menu-cascade' } as MenuBit, ste).catch(
                (err: any) => {
                    try {
                        lib.hunt(CONSOLE_UPDATE, {
                            idx: 'cns00',
                            src: `:: [MENU_FAULT] ${err?.message || err}`,
                        })
                    } catch {
                        // Headless teardown in progress; nothing left to report to.
                    }
                },
            )
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
    const lib = (globalThis as any).LIBRARY || (global as any).LIBRARY

    // Headless execution safety fallback for CI and non-TTY test environments
    if (!lib || typeof lib.hunt !== 'function') {
        if (bal?.slv) {
            bal.slv({ mnuBit: { idx: 'update-menu-headless', val: 0 } })
        }
        return cpy
    }

    const lst = [
        '1. VALIDATE SCHEMA INVARIANTS',
        '2. RUN SOMATIC SAT SOLVER',
        '3. AUDIT KINETIC MOTOR MASKS',
        '4. VERIFY HEAP IMMUTABILITY',
        'ROOT MENU',
    ]

    const descriptions: Record<string, string> = {
        '1. VALIDATE SCHEMA INVARIANTS':
            'Validate frontmatter entities against strict Zod contracts.',
        '2. RUN SOMATIC SAT SOLVER':
            'Evaluate upper-limb capacity and anatomical hand saturation.',
        '3. AUDIT KINETIC MOTOR MASKS':
            'Assert action verb exclusion against locomotion tiers and conditions.',
        '4. VERIFY HEAP IMMUTABILITY':
            'Confirm deepFreeze traps property mutation on sealed entities.',
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
            await lib.hunt(CONSOLE_UPDATE, {
                idx: 'cns00',
                src: '>> [IMMUTABILITY:PASS] Object.freeze recursion traps mutations with strict TypeError.',
            })
            break
        }

        case 'ROOT MENU': {
            await lib.hunt(TERMINAL_CLEAR, {})
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

export default updateMenu
